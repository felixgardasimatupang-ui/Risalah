import re
import uuid
from app.models.schemas import ContextRequest, ContextResponse, ActionItem, Decision


class ContextExtractorService:
    def __init__(self):
        self.nlp = None
        try:
            import spacy
            self.nlp = spacy.load("id_core_news_sm")
        except Exception:
            pass

    def extract(self, request: ContextRequest) -> ContextResponse:
        text = request.text
        return ContextResponse(
            action_items=self.extract_action_items(text),
            decisions=self.extract_decisions(text),
            votes=self._extract_votes(text),
            interruptions=self._extract_interruptions(text),
            deadlines=self._extract_deadlines(text),
        )

    def extract_action_items(self, text: str) -> list[ActionItem]:
        items = []
        patterns = [
            (r"(?:tolong|harap|mohon|agar|diminta|wajib)\s+(.+?)(?:\.|$)", "instruction"),
            (r"(?:menugaskan|menunjuk|ditugaskan)\s+(.*?)(?:untuk|agar)\s+(.+?)(?:\.|$)", "assignment"),
            (r"(?:akan|langsung)\s+(?:ditindaklanjuti|dilaksanakan|diproses)(?:\.|$)", "follow_up"),
            (r"(?:PIC|penanggung jawab|bertanggung jawab)\s+(.+?)(?:\.|$)", "pic"),
        ]

        for pattern, action_type in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                items.append(ActionItem(
                    id=f"ai-{uuid.uuid4().hex[:8]}",
                    description=match.group(0).strip(),
                    pic=self._extract_pic(match.group(0)),
                    priority=self._classify_priority(match.group(0)),
                ))

        return items

    def extract_decisions(self, text: str) -> list[Decision]:
        decisions = []
        patterns = [
            (r"(?:memutuskan|menetapkan|memutuskans)\s+(.+?)(?:\.|$)", "decision"),
            (r"(?:menyetujui|menyetujui|menerima)\s+(.+?)(?:\.|$)", "approval"),
            (r"(?:menolak|menolak|tidak menyetujui)\s+(.+?)(?:\.|$)", "rejection"),
            (r"(?:memerintahkan|menginstruksikan|mengarahkan)\s+(.+?)(?:\.|$)", "instruction"),
            (r"(?:kesepakatan|disepakati)\s+(.+?)(?:\.|$)", "agreement"),
        ]

        for pattern, category in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                decisions.append(Decision(
                    id=f"dc-{uuid.uuid4().hex[:8]}",
                    description=match.group(0).strip(),
                    category=category,
                ))

        return decisions

    def _extract_votes(self, text: str) -> list[dict]:
        votes = []
        patterns = [
            r"(?:setuju|menyetujui|sepakat)\s+(.+?)(?:\.|$)",
            r"(?:tidak setuju|menolak|keberatan)\s+(.+?)(?:\.|$)",
            r"(?:abstain|abstain)\s+(.+?)(?:\.|$)",
            r"(?:voting|pemungutan suara|pemilihan)\s+(.+?)(?:\.|$)",
        ]
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                votes.append({
                    "text": match.group(0).strip(),
                    "type": "approve" if "setuju" in match.group(0).lower() else "reject",
                })
        return votes

    def _extract_interruptions(self, text: str) -> list[dict]:
        interruptions = []
        patterns = [
            r"(?:interupsi|menyela|memotong)[,\s]+(.+?)(?:\.|$)",
            r"(?:izin|ijin)\s+(?:berbicara|menambahkan|bertanya|menyela)[,\s]+(.+?)(?:\.|$)",
        ]
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                interruptions.append({
                    "text": match.group(0).strip(),
                })
        return interruptions

    def _extract_deadlines(self, text: str) -> list[dict]:
        deadlines = []
        date_patterns = [
            r"(?:sebelum|sampai|hingga|batas)\s+(?:tanggal\s+)?(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})",
            r"(?:akhir|awal|pertengahan)\s+(?:bulan\s+)?(?:ini|depan|besok|ini)",
            r"(?:tenggat|deadline)\s+(.+?)(?:\.|$)",
        ]
        for pattern in date_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                deadlines.append({
                    "text": match.group(0).strip(),
                    "date": match.group(1) if match.lastindex and match.group(1) else None,
                })
        return deadlines

    def _extract_pic(self, text: str) -> str | None:
        name_patterns = [
            r"(?:oleh|kepada|PIC|pic)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"(?:Bapak|Ibu|Sdr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        ]
        for pattern in name_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        return None

    def _classify_priority(self, text: str) -> str:
        urgent = ["segera", "hari ini", "besok", "urgent", "penting", "kritis"]
        if any(w in text.lower() for w in urgent):
            return "high"
        return "medium"
