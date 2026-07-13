"""
Context Engine Skill - Core Implementation
Analyzes transcript context and extracts structured meeting intelligence.
"""
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from app.models.schemas import ContextResponse, ActionItem, Decision


class ContextCategory(str, Enum):
    ACTION_ITEM = "action_item"
    DECISION = "decision"
    VOTE = "vote"
    INTERRUPTION = "interruption"
    DEADLINE = "deadline"
    BUDGET = "budget"
    PERSONNEL = "personnel"
    POLICY = "policy"


@dataclass
class ExtractedActionItem:
    description: str
    pic: Optional[str] = None
    deadline: Optional[str] = None
    priority: str = "medium"
    confidence: float = 0.0
    source_text: str = ""
    line_ids: List[str] = field(default_factory=list)


@dataclass
class ExtractedDecision:
    description: str
    category: str
    is_approved: bool = False
    confidence: float = 0.0
    source_text: str = ""
    line_ids: List[str] = field(default_factory=list)


class ContextEngine:
    """
    Context Engine - Extracts structured meeting intelligence from transcripts.
    
    Capabilities:
    - Action item extraction with PIC, deadline, priority
    - Decision detection (approval, rejection, voting)
    - Vote tracking (for/against/abstain)
    - Interruption detection
    - Deadline extraction
    - Budget discussion tracking
    - Personnel changes
    - Policy discussions
    """
    
    def __init__(self):
        self.action_patterns = self._compile_action_patterns()
        self.decision_patterns = self._compile_decision_patterns()
        self.vote_patterns = self._compile_vote_patterns()
        self.deadline_patterns = self._compile_deadline_patterns()
        self.person_patterns = self._compile_person_patterns()
        self.budget_patterns = self._compile_budget_patterns()
    
    def _compile_action_patterns(self) -> List[Tuple[re.Pattern, float]]:
        """Compile regex patterns for action item detection"""
        patterns = [
            # Indonesian action patterns
            (r'(?:akan|harus|perlu|wajib|sebaiknya)\s+(\w+.*?)(?:\s+pada\s+\w+|\s+sebelum\s+\w+|\.$)', 0.8),
            (r'(?:tindak lanjut|follow.up|action.item)\s*:?\s*(.+?)(?:\.|$)', 0.9),
            (r'(?:pic|penanggung.jawab|bertanggung.jawab)\s*:?\s*(\w+)', 0.85),
            (r'(?:deadline|batas.waktu|selesai|target)\s*:?\s*(\w+)', 0.85),
            (r'(?:prioritas|urgent|segera)\s*:?\s*(\w+)', 0.75),
            # English patterns
            (r'(?:will|must|should|need to|have to)\s+(\w+.*?)(?:\s+by\s+\w+|\.)', 0.8),
            (r'action.item\s*:?\s*(.+?)(?:\.|$)', 0.9),
            (r'(?:owner|responsible|pic)\s*:?\s*(\w+)', 0.85),
        ]
        return [(re.compile(p, re.IGNORECASE), c) for p, c in patterns]
    
    def _compile_decision_patterns(self) -> List[Tuple[re.Pattern, float, str]]:
        """Compile decision detection patterns with category"""
        patterns = [
            # Approval patterns
            (r'(?:disetujui|diterima|approved|disepakati)\s*:?\s*(.+?)(?:\.|$)', 0.9, "approval"),
            (r'(?:keputusan|decision)\s*:?\s*(.+?)(?:\.|$)', 0.8, "decision"),
            (r'(?:putusan|putusan)\s*:?\s*(.+?)(?:\.|$)', 0.85, "decision"),
            # Rejection patterns
            (r'(?:ditolak|rejected|tidak disetujui)\s*:?\s*(.+?)(?:\.|$)', 0.9, "rejection"),
            # Voting
            (r'(?:voting|pemungutan suara)\s*:?\s*(.+?)(?:\.|$)', 0.85, "vote"),
            (r'(?:setuju|agree|pro)\s*(\d+)\s*(?:tidak setuju|against|contra)\s*(\d+)', 0.9, "vote"),
        ]
        return [(re.compile(p, re.IGNORECASE), c, cat) for p, c, cat in patterns]
    
    def _compile_vote_patterns(self) -> List[Tuple[re.Pattern, float]]:
        """Compile voting patterns"""
        patterns = [
            (r'(?:pro|setuju|agree)\s*(\d+)\s*(?:kontra|tidak setuju|against)\s*(\d+)\s*(?:abstain|menahan suara)\s*(\d+)', 0.95),
            (r'(?:vote|voting)\s*[:=]\s*(\d+)\s*[-/]\s*(\d+)\s*[-/]\s*(\d+)', 0.9),
            (r'(?:setuju|agree)\s*(\d+)\s*(?:tidak|against|kontra)\s*(\d+)', 0.9),
        ]
        return [(re.compile(p, re.IGNORECASE), c) for p, c in patterns]
    
    def _compile_deadline_patterns(self) -> List[Tuple[re.Pattern, float]]:
        """Compile deadline/date patterns"""
        patterns = [
            (r'(?:deadline|batas waktu|selesai|target|due date)\s*[:=]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', 0.95),
            (r'(?:sebelum|before|hingga|until)\s+(\d{1,2}\s+\w+\s+\d{4})', 0.9),
            (r'(?:minggu|pekan|bulan)\s+(?:depan|berikut|ini)', 0.7),
            (r'(?:hari ini|besok|minggu ini|bulan ini)', 0.8),
        ]
        return [(re.compile(p, re.IGNORECASE), c) for p, c in patterns]
    
    def _compile_person_patterns(self) -> List[Tuple[re.Pattern, float]]:
        """Compile person/PIC patterns"""
        patterns = [
            (r'(?:pic|penanggung.jawab|bertanggung.jawab|owner|responsible)\s*[:=]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', 0.9),
            (r'(?:dikoordinasikan.oleh|disediakan.oleh|dilakukan.oleh)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', 0.85),
            (r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:akan|bertanggung.jawab|menangani)\b', 0.8),
        ]
        return [(re.compile(p, re.IGNORECASE), c) for p, c in patterns]
    
    def _compile_budget_patterns(self) -> List[Tuple[re.Pattern, float]]:
        """Compile budget/financial patterns"""
        patterns = [
            (r'(?:anggaran|budget|dana|biaya)\s*[:=]\s*(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:triliun|miliar|juta|ribu)?', 0.9),
            (r'(?:rp|rupiah)\s*(\d+(?:[.,]\d+)?)\s*(?:triliun|miliar|juta|ribu|t|m|k)?', 0.85),
            (r'(?:realisasi|pencairan|penyaluran)\s*(?:anggaran|dana)\s*[:=]\s*(\d+(?:[.,]\d+)?)', 0.85),
        ]
        return [(re.compile(p, re.IGNORECASE), c) for p, c in patterns]
    
    def analyze(self, text: str, line_ids: Optional[List[str]] = None) -> ContextResponse:
        """
        Analyze transcript text and extract structured context.
        
        Args:
            text: Full transcript text
            line_ids: Optional list of line IDs corresponding to text segments
            
        Returns:
            ContextResponse with extracted items
        """
        action_items = self._extract_action_items(text, line_ids)
        decisions = self._extract_decisions(text, line_ids)
        votes = self._extract_votes(text, line_ids)
        interruptions = self._extract_interruptions(text, line_ids)
        deadlines = self._extract_deadlines(text, line_ids)
        
        return ContextResponse(
            action_items=[ActionItem(**ai) for ai in action_items],
            decisions=[Decision(**d) for d in decisions],
            votes=votes,
            interruptions=interruptions,
            deadlines=deadlines,
        )
    
    def _extract_action_items(self, text: str, line_ids: Optional[List[str]]) -> List[Dict]:
        """Extract action items with PIC, deadline, priority"""
        items = []
        
        # Split into sentences
        sentences = re.split(r'[.!?]\s+', text)
        
        for i, sent in enumerate(sentences):
            sent = sent.strip()
            if len(sent) < 10:
                continue
            
            action_score = 0
            matched_patterns = []
            
            for pattern, confidence in self.action_patterns:
                matches = pattern.findall(sent)
                if matches:
                    action_score += confidence
                    matched_patterns.extend(matches)
            
            if action_score > 0.7:
                # Extract PIC
                pic = self._extract_pic(sent)
                
                # Extract deadline
                deadline = self._extract_deadline(sent)
                
                # Determine priority
                priority = self._determine_priority(sent)
                
                item = {
                    "id": f"ai_{len(items)+1}",
                    "description": sent[:200],
                    "pic": pic,
                    "deadline": deadline,
                    "priority": priority,
                    "confidence": min(action_score, 1.0),
                }
                items.append(item)
        
        return items
    
    def _extract_pic(self, text: str) -> Optional[str]:
        """Extract Person In Charge from text"""
        for pattern, confidence in self.person_patterns:
            matches = pattern.findall(text)
            if matches:
                return matches[0] if isinstance(matches[0], str) else matches[0][0]
        return None
    
    def _extract_deadline(self, text: str) -> Optional[str]:
        """Extract deadline from text"""
        for pattern, confidence in self.deadline_patterns:
            matches = pattern.findall(text)
            if matches:
                return matches[0] if isinstance(matches[0], str) else str(matches[0])
        return None
    
    def _determine_priority(self, text: str) -> str:
        """Determine priority from text"""
        text_lower = text.lower()
        if any(w in text_lower for w in ['urgent', 'segera', 'penting', 'critical', 'prioritas tinggi']):
            return "high"
        elif any(w in text_lower for w in ['biasa', 'normal', 'standar']):
            return "low"
        return "medium"
    
    def _extract_decisions(self, text: str, line_ids: Optional[List[str]]) -> List[Dict]:
        """Extract decisions from text"""
        decisions = []
        
        for pattern, confidence, category in self.decision_patterns:
            matches = pattern.findall(text)
            for match in matches:
                desc = match if isinstance(match, str) else match[0]
                
                # Determine if approved
                is_approved = category in ["approval", "vote"]
                
                decisions.append({
                    "id": f"dec_{len(decisions)+1}",
                    "description": desc[:200],
                    "category": category,
                    "is_approved": is_approved,
                    "confidence": confidence,
                })
        
        return decisions
    
    def _extract_votes(self, text: str, line_ids: Optional[List[str]]) -> List[Dict]:
        """Extract voting results"""
        votes = []
        
        for pattern, confidence in self.vote_patterns:
            matches = pattern.findall(text)
            for match in matches:
                if isinstance(match, tuple):
                    pro, contra, *abstain = match
                    votes.append({
                        "pro": int(pro),
                        "contra": int(contra),
                        "abstain": int(abstain[0]) if abstain else 0,
                        "confidence": confidence,
                    })
        
        return votes
    
    def _extract_interruptions(self, text: str, line_ids: Optional[List[str]]) -> List[Dict]:
        """Extract interruptions/overlaps"""
        interruptions = []
        
        # Simple pattern: "maaf", "permisi", "tunggu", "interupsi"
        interruption_words = ['maaf', 'permisi', 'tunggu', 'interupsi', 'interupsi', 'mohon']
        
        for word in interruption_words:
            pattern = re.compile(rf'\b{word}\b', re.IGNORECASE)
            matches = pattern.finditer(text)
            for match in matches:
                interruptions.append({
                    "type": "verbal_interruption",
                    "trigger": word,
                    "position": match.start(),
                    "confidence": 0.7,
                })
        
        return interruptions
    
    def _extract_deadlines(self, text: str, line_ids: Optional[List[str]]) -> List[Dict]:
        """Extract explicit deadlines"""
        deadlines = []
        
        for pattern, confidence in self.deadline_patterns:
            matches = pattern.findall(text)
            for match in matches:
                deadline_str = match if isinstance(match, str) else str(match)
                deadlines.append({
                    "deadline": deadline_str,
                    "confidence": confidence,
                })
        
        return deadlines
    
    def _extract_budget_info(self, text: str) -> List[Dict]:
        """Extract budget/financial information"""
        budget_info = []
        
        for pattern, confidence in self.budget_patterns:
            matches = pattern.findall(text)
            for match in matches:
                amount = match if isinstance(match, str) else match[0]
                budget_info.append({
                    "amount": amount,
                    "confidence": confidence,
                })
        
        return budget_info


class ContextEngineSkill:
    """
    Context Engine Skill for OpenCode skill system.
    """
    
    def __init__(self):
        self.engine = ContextEngine()
    
    def analyze_context(self, text: str, line_ids: Optional[List[str]] = None) -> ContextResponse:
        """Analyze transcript and extract context"""
        return self.engine.analyze(text, line_ids)
    
    def extract_action_items(self, text: str) -> List[Dict]:
        """Extract just action items"""
        return self.engine._extract_action_items(text, None)
    
    def extract_decisions(self, text: str) -> List[Dict]:
        """Extract just decisions"""
        return self.engine._extract_decisions(text, None)
    
    def extract_votes(self, text: str) -> List[Dict]:
        """Extract voting results"""
        return self.engine._extract_votes(text, None)


# Export instances
context_engine = ContextEngine()
context_engine_skill = ContextEngineSkill()