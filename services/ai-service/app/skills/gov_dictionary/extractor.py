"""
Government Dictionary Skill - Core Implementation
Extracts and normalizes Indonesian government terminology from text.
"""
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field
from app.models.schemas import GovernmentEntity


@dataclass
class TermEntry:
    """Government term entry with metadata"""
    term: str
    normalized: str
    category: str
    definition: str
    confidence: float = 0.9
    aliases: List[str] = field(default_factory=list)
    regex_pattern: Optional[str] = None


class GovDictionaryExtractor:
    """
    Government Dictionary Extractor
    
    Extracts and normalizes Indonesian government terminology:
    - Lembaga Negara (DPR, DPD, MPR, MK, MA, BPK, KPK, Ombudsman)
    - Anggaran (APBD, APBN, PAD, DAU, DAK, DBH, SILPA)
    - Struktur Pemerintahan (OPD, Bappeda, Banggar, Sekda, Komisi)
    - Jabatan (Gubernur, Bupati, Walikota, Sekda, Kepala Dinas)
    - Regulasi (UU, PP, Perpres, Permendagri, Perda, Peraturan)
    - Wilayah (Provinsi, Kabupaten, Kota, Kecamatan, Kelurahan)
    """
    
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path(__file__).parent / "data"
        self.terms: Dict[str, TermEntry] = {}
        self._compiled_patterns: Dict[str, re.Pattern] = {}
        self._load_data()
        self._compile_patterns()
    
    def _load_data(self):
        """Load terminology data from JSON files"""
        # Load from embedded defaults if files don't exist
        self._load_defaults()
        
        # Override with file data if available
        for category in ["government_terms", "institutions", "regulations", "positions", "regions"]:
            file_path = self.data_dir / f"{category}.json"
            if file_path.exists():
                self._load_category(file_path, category)
    
    def _load_defaults(self):
        """Load built-in default terminology"""
        
        # Lembaga Negara
        self._add_terms("lembaga_negara", [
            TermEntry("DPR", "Dewan Perwakilan Rakyat", "lembaga_negara", "Dewan Perwakilan Rakyat Republik Indonesia", 0.98, ["DPR RI"]),
            TermEntry("DPD", "Dewan Perwakilan Daerah", "lembaga_negara", "Dewan Perwakilan Daerah Republik Indonesia", 0.98),
            TermEntry("MPR", "Majelis Permusyawaratan Rakyat", "lembaga_negara", "Majelis Permusyawaratan Rakyat Republik Indonesia", 0.98),
            TermEntry("MK", "Mahkamah Konstitusi", "lembaga_negara", "Mahkamah Konstitusi Republik Indonesia", 0.95),
            TermEntry("MA", "Mahkamah Agung", "lembaga_negara", "Mahkamah Agung Republik Indonesia", 0.95),
            TermEntry("BPK", "Badan Pemeriksa Keuangan", "lembaga_negara", "Badan Pemeriksa Keuangan Republik Indonesia", 0.95),
            TermEntry("KPK", "Komisi Pemberantasan Korupsi", "lembaga_negara", "Komisi Pemberantasan Korupsi", 0.95),
            TermEntry("Ombudsman", "Ombudsman Republik Indonesia", "lembaga_negara", "Ombudsman Republik Indonesia", 0.90),
            TermEntry("KY", "Komisi Yudisial", "lembaga_negara", "Komisi Yudisial", 0.90),
        ])
        
        # Anggaran
        self._add_terms("anggaran", [
            TermEntry("APBD", "Anggaran Pendapatan dan Belanja Daerah", "anggaran", "Anggaran Pendapatan dan Belanja Daerah", 0.98),
            TermEntry("APBN", "Anggaran Pendapatan dan Belanja Negara", "anggaran", "Anggaran Pendapatan dan Belanja Negara", 0.98),
            TermEntry("PAD", "Pendapatan Asli Daerah", "anggaran", "Pendapatan Asli Daerah", 0.95),
            TermEntry("DAU", "Dana Alokasi Umum", "anggaran", "Dana Alokasi Umum", 0.95),
            TermEntry("DAK", "Dana Alokasi Khusus", "anggaran", "Dana Alokasi Khusus", 0.95),
            TermEntry("DBH", "Dana Bagi Hasil", "anggaran", "Dana Bagi Hasil", 0.90),
            TermEntry("SILPA", "Sisa Lebih Perhitungan Anggaran", "anggaran", "Sisa Lebih Perhitungan Anggaran", 0.90),
            TermEntry("SILK", "Sisa Lebih Kas", "anggaran", "Sisa Lebih Kas", 0.85),
            TermEntry("Pagu", "Pagu Anggaran", "anggaran", "Pagu Anggaran", 0.85),
            TermEntry("Realisasi", "Realisasi Anggaran", "anggaran", "Realisasi Anggaran", 0.90),
        ])
        
        # Struktur Pemerintahan
        self._add_terms("struktur_pemerintahan", [
            TermEntry("OPD", "Organisasi Perangkat Daerah", "struktur_pemerintahan", "Organisasi Perangkat Daerah", 0.97),
            TermEntry("Bappeda", "Badan Perencanaan Pembangunan Daerah", "struktur_pemerintahan", "Badan Perencanaan Pembangunan Daerah", 0.95),
            TermEntry("Banggar", "Badan Anggaran", "struktur_pemerintahan", "Badan Anggaran", 0.95),
            TermEntry("Bapemperda", "Badan Pembentukan Peraturan Daerah", "struktur_pemerintahan", "Badan Pembentukan Peraturan Daerah", 0.95),
            TermEntry("Sekretariat", "Sekretariat Daerah/DPRD", "struktur_pemerintahan", "Sekretariat Daerah atau Sekretariat DPRD", 0.90),
            TermEntry("Komisi", "Komisi DPRD", "struktur_pemerintahan", "Komisi di Dewan Perwakilan Rakyat Daerah", 0.85),
            TermEntry("Badan", "Badan Pemerintah", "struktur_pemerintahan", "Badan di lingkungan pemerintah", 0.80),
            TermEntry("Dinas", "Dinas Pemerintah", "struktur_pemerintahan", "Dinas/Organisasi Perangkat Daerah", 0.90),
        ])
        
        # Jabatan
        self._add_terms("jabatan", [
            TermEntry("Gubernur", "Kepala Daerah Provinsi", "jabatan", "Gubernur Kepala Daerah Provinsi", 0.98),
            TermEntry("Bupati", "Kepala Daerah Kabupaten", "jabatan", "Bupati Kepala Daerah Kabupaten", 0.98),
            TermEntry("Walikota", "Kepala Daerah Kota", "jabatan", "Walikota Kepala Daerah Kota", 0.98),
            TermEntry("Sekda", "Sekretaris Daerah", "jabatan", "Sekretaris Daerah", 0.95),
            TermEntry("Kepala Dinas", "Kepala Dinas/Organisasi Perangkat Daerah", "jabatan", "Kepala Dinas", 0.95),
            TermEntry("Kepala Badan", "Kepala Badan Pemerintah", "jabatan", "Kepala Badan", 0.90),
            TermEntry("Asisten", "Asisten Daerah", "jabatan", "Asisten Daerah", 0.85),
            TermEntry("Kepala Bagian", "Kepala Bagian di Sekretariat Daerah", "jabatan", "Kepala Bagian", 0.85),
            TermEntry("Camat", "Kepala Kecamatan", "jabatan", "Camat Kepala Kecamatan", 0.90),
            TermEntry("Lurah", "Kepala Kelurahan", "jabatan", "Lurah Kepala Kelurahan", 0.90),
            TermEntry("Kades", "Kepala Desa", "jabatan", "Kepala Desa", 0.90),
        ])
        
        # Regulasi
        self._add_terms("regulasi", [
            TermEntry("UU", "Undang-Undang", "regulasi", "Undang-Undang", 0.98),
            TermEntry("Perpres", "Peraturan Presiden", "regulasi", "Peraturan Presiden", 0.97),
            TermEntry("PP", "Peraturan Pemerintah", "regulasi", "Peraturan Pemerintah", 0.97),
            TermEntry("Permendagri", "Peraturan Menteri Dalam Negeri", "regulasi", "Peraturan Menteri Dalam Negeri", 0.97),
            TermEntry("Permenkeu", "Peraturan Menteri Keuangan", "regulasi", "Peraturan Menteri Keuangan", 0.95),
            TermEntry("Perda", "Peraturan Daerah", "regulasi", "Peraturan Daerah", 0.97),
            TermEntry("Perkada", "Peraturan Kepala Daerah", "regulasi", "Peraturan Kepala Daerah", 0.90),
            TermEntry("SK", "Surat Keputusan", "regulasi", "Surat Keputusan", 0.85),
            TermEntry("SE", "Surat Edaran", "regulasi", "Surat Edaran", 0.85),
            TermEntry("Instruksi", "Instruksi", "regulasi", "Instruksi", 0.85),
            TermEntry("Peraturan", "Peraturan", "regulasi", "Peraturan umum", 0.85),
        ])
        
        # Wilayah
        self._add_terms("wilayah", [
            TermEntry("Provinsi", "Provinsi", "wilayah", "Provinsi", 0.95),
            TermEntry("Kabupaten", "Kabupaten", "wilayah", "Kabupaten", 0.95),
            TermEntry("Kota", "Kota", "wilayah", "Kota", 0.95),
            TermEntry("Kecamatan", "Kecamatan", "wilayah", "Kecamatan", 0.95),
            TermEntry("Kelurahan", "Kelurahan", "wilayah", "Kelurahan", 0.95),
            TermEntry("Desa", "Desa", "wilayah", "Desa", 0.95),
            TermEntry("DKI Jakarta", "Daerah Khusus Ibukota Jakarta", "wilayah", "Daerah Khusus Ibukota Jakarta", 0.98),
            TermEntry("DI Yogyakarta", "Daerah Istimewa Yogyakarta", "wilayah", "Daerah Istimewa Yogyakarta", 0.98),
            TermEntry("Aceh", "Aceh", "wilayah", "Provinsi Aceh", 0.95),
            TermEntry("Papua", "Papua", "wilayah", "Provinsi Papua", 0.95),
        ])
        
        # Kementerian/Lembaga Pusat
        self._add_terms("institusi_pusat", [
            TermEntry("Kemendagri", "Kementerian Dalam Negeri", "institusi_pusat", "Kementerian Dalam Negeri", 0.97),
            TermEntry("Kemenkeu", "Kementerian Keuangan", "institusi_pusat", "Kementerian Keuangan", 0.97),
            TermEntry("Kemenkumham", "Kementerian Hukum dan HAM", "institusi_pusat", "Kementerian Hukum dan Hak Asasi Manusia", 0.95),
            TermEntry("Kemendikbud", "Kementerian Pendidikan dan Kebudayaan", "institusi_pusat", "Kementerian Pendidikan dan Kebudayaan", 0.95),
            TermEntry("Kemenkes", "Kementerian Kesehatan", "institusi_pusat", "Kementerian Kesehatan", 0.95),
            TermEntry("Kemenpera", "Kementerian Pemberdayaan Aparatur Negara dan Reformasi Birokrasi", "institusi_pusat", "Kementerian PANRB", 0.95),
            TermEntry("Bappenas", "Badan Perencanaan Pembangunan Nasional", "institusi_pusat", "Badan Perencanaan Pembangunan Nasional", 0.95),
            TermEntry("Sekneg", "Sekretariat Negara", "institusi_pusat", "Sekretariat Negara", 0.95),
            TermEntry("Kabinet", "Kabinet", "institusi_pusat", "Kabinet", 0.90),
        ])
    
    def _add_terms(self, category: str, terms: List[TermEntry]):
        for term in terms:
            key = f"{category}:{term.term.lower()}"
            self.terms[key] = term
    
    def _load_category(self, file_path: Path, category: str):
        try:
            with open(file_path) as f:
                data = json.load(f)
            
            for item in data:
                term = TermEntry(**item)
                key = f"{category}:{term.term.lower()}"
                self.terms[key] = term
        except Exception as e:
            print(f"Warning: Could not load {file_path}: {e}")
    
    def _compile_patterns(self):
        """Compile regex patterns for all terms"""
        for key, term in self.terms.items():
            pattern = term.regex_pattern or re.escape(term.term)
            # Add word boundaries for exact matching
            pattern = r'\b' + pattern + r'\b'
            try:
                self._compiled_patterns[key] = re.compile(pattern, re.IGNORECASE)
            except re.error:
                pass  # Skip invalid patterns
    
    def extract(self, text: str, categories: Optional[List[str]] = None) -> List[GovernmentEntity]:
        """
        Extract government entities from text.
        
        Args:
            text: Input text to analyze
            categories: Optional list of categories to filter (None = all)
            
        Returns:
            List of GovernmentEntity objects
        """
        entities = []
        seen: Set[tuple] = set()
        
        for key, pattern in self._compiled_patterns.items():
            term = self.terms[key]
            
            # Filter by category if specified
            if categories and term.category not in categories:
                continue
            
            for match in pattern.finditer(text):
                entity_key = (match.start(), match.end(), term.normalized)
                if entity_key in seen:
                    continue
                seen.add(entity_key)
                
                entities.append(GovernmentEntity(
                    entity_type=term.category,
                    text=match.group(0),
                    normalized_text=term.normalized,
                    category=term.category,
                    confidence=term.confidence,
                ))
        
        # Sort by position
        entities.sort(key=lambda e: text.find(e.text))
        return entities
    
    def normalize(self, term: str) -> Optional[str]:
        """Normalize a single term to its canonical form"""
        term_lower = term.lower().strip()
        
        for key, t in self.terms.items():
            if t.term.lower() == term_lower:
                return t.normalized
            if term_lower in [a.lower() for a in t.aliases]:
                return t.normalized
        
        return None
    
    def get_glossary(self, category: Optional[str] = None) -> Dict[str, Any]:
        """Get glossary of terms"""
        result = {}
        for key, term in self.terms.items():
            if category and term.category != category:
                continue
            if term.category not in result:
                result[term.category] = []
            result[term.category].append({
                "term": term.term,
                "normalized": term.normalized,
                "definition": term.definition,
                "confidence": term.confidence,
                "aliases": term.aliases,
            })
        return result
    
    def get_categories(self) -> List[str]:
        """Get all available categories"""
        return list(set(t.category for t in self.terms.values()))


class GovDictionarySkill:
    """
    Government Dictionary Skill for OpenCode skill system.
    """
    
    def __init__(self):
        self.extractor = GovDictionaryExtractor()
    
    def extract_entities(self, text: str) -> List[GovernmentEntity]:
        """Extract government entities from text"""
        return self.extractor.extract(text)
    
    def normalize_term(self, term: str) -> Optional[str]:
        """Normalize a single term"""
        return self.extractor.normalize(term)
    
    def get_glossary(self, category: Optional[str] = None) -> Dict:
        """Get glossary of terms"""
        return self.extractor.get_glossary(category)
    
    def get_categories(self) -> List[str]:
        """Get available categories"""
        return self.extractor.get_categories()


# Export instances
gov_dictionary_extractor = GovDictionaryExtractor()
gov_dictionary_skill = GovDictionarySkill()