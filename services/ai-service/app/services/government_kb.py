import json
import os
import re
from pathlib import Path
from app.models.schemas import GovernmentExtractionRequest, GovernmentExtractionResponse, GovernmentEntity


class GovernmentKBService:
    def __init__(self):
        self.kb_dir = Path(__file__).parent.parent / "knowledge_base"
        self.terms = self._load_json("government_terms.json", self._default_terms())
        self.institutions = self._load_json("institutions.json", self._default_institutions())
        self.regions = self._load_json("indonesia_regions.json", self._default_regions())

    def _load_json(self, filename: str, default: dict) -> dict:
        path = self.kb_dir / filename
        if path.exists():
            with open(path) as f:
                return json.load(f)
        return default

    def extract_entities(self, request: GovernmentExtractionRequest) -> GovernmentExtractionResponse:
        text = request.text
        entities = []

        for category, items in self.terms.items():
            for term, info in items.items():
                pattern = re.compile(re.escape(term), re.IGNORECASE)
                for match in pattern.finditer(text):
                    entities.append(GovernmentEntity(
                        entity_type="government_term",
                        text=match.group(0),
                        normalized_text=term,
                        category=category,
                        confidence=info.get("confidence", 0.9),
                    ))

        for inst in self.institutions:
            pattern = re.compile(re.escape(inst["name"]), re.IGNORECASE)
            for match in pattern.finditer(text):
                entities.append(GovernmentEntity(
                    entity_type="institution",
                    text=match.group(0),
                    normalized_text=inst["name"],
                    category=inst.get("type", "institution"),
                    confidence=0.95,
                ))

        entities = self._deduplicate(entities)
        return GovernmentExtractionResponse(entities=entities)

    def get_knowledge_base(self, category: str | None = None) -> dict:
        if category:
            return {category: self.terms.get(category, {})}
        return {"terms": self.terms, "institutions": self.institutions}

    def get_glossary(self) -> list[dict]:
        glossary = []
        for category, items in self.terms.items():
            for term, info in items.items():
                glossary.append({
                    "term": term,
                    "definition": info.get("definition", ""),
                    "category": category,
                })
        return glossary

    def _deduplicate(self, entities: list[GovernmentEntity]) -> list[GovernmentEntity]:
        seen = set()
        unique = []
        for e in entities:
            key = (e.text.lower(), e.category)
            if key not in seen:
                seen.add(key)
                unique.append(e)
        return unique

    def _default_terms(self) -> dict:
        return {
            "lembaga_negara": {
                "DPRD": {"definition": "Dewan Perwakilan Rakyat Daerah", "confidence": 0.98},
                "DPR": {"definition": "Dewan Perwakilan Rakyat", "confidence": 0.98},
                "DPD": {"definition": "Dewan Perwakilan Daerah", "confidence": 0.98},
                "MK": {"definition": "Mahkamah Konstitusi", "confidence": 0.95},
                "MA": {"definition": "Mahkamah Agung", "confidence": 0.95},
                "BPK": {"definition": "Badan Pemeriksa Keuangan", "confidence": 0.95},
            },
            "anggaran": {
                "APBD": {"definition": "Anggaran Pendapatan dan Belanja Daerah", "confidence": 0.98},
                "APBN": {"definition": "Anggaran Pendapatan dan Belanja Negara", "confidence": 0.98},
                "PAD": {"definition": "Pendapatan Asli Daerah", "confidence": 0.95},
                "DAU": {"definition": "Dana Alokasi Umum", "confidence": 0.95},
                "DAK": {"definition": "Dana Alokasi Khusus", "confidence": 0.95},
                "DBH": {"definition": "Dana Bagi Hasil", "confidence": 0.90},
                "SILPA": {"definition": "Sisa Lebih Perhitungan Anggaran", "confidence": 0.90},
            },
            "struktur_pemerintahan": {
                "OPD": {"definition": "Organisasi Perangkat Daerah", "confidence": 0.97},
                "Bappeda": {"definition": "Badan Perencanaan Pembangunan Daerah", "confidence": 0.95},
                "Bapemperda": {"definition": "Badan Pembentukan Peraturan Daerah", "confidence": 0.95},
                "Banggar": {"definition": "Badan Anggaran", "confidence": 0.95},
                "Komisi": {"definition": "Komisi di DPRD", "confidence": 0.85},
                "Sekretariat": {"definition": "Sekretariat DPRD/Daerah", "confidence": 0.90},
                "Badan": {"definition": "Badan di lingkungan pemerintah", "confidence": 0.80},
            },
            "jabatan": {
                "Gubernur": {"definition": "Kepala Daerah Provinsi", "confidence": 0.98},
                "Bupati": {"definition": "Kepala Daerah Kabupaten", "confidence": 0.98},
                "Walikota": {"definition": "Kepala Daerah Kota", "confidence": 0.98},
                "Sekda": {"definition": "Sekretaris Daerah", "confidence": 0.95},
                "Kepala Dinas": {"definition": "Kepala Dinas/Organisasi Perangkat Daerah", "confidence": 0.95},
            },
            "regulasi": {
                "Permendagri": {"definition": "Peraturan Menteri Dalam Negeri", "confidence": 0.97},
                "Perpres": {"definition": "Peraturan Presiden", "confidence": 0.97},
                "PP": {"definition": "Peraturan Pemerintah", "confidence": 0.95},
                "UU": {"definition": "Undang-Undang", "confidence": 0.98},
                "Perda": {"definition": "Peraturan Daerah", "confidence": 0.97},
                "Peraturan": {"definition": "Peraturan", "confidence": 0.85},
            },
        }

    def _default_institutions(self) -> list[dict]:
        return [
            {"name": "Kementerian Sekretariat Negara", "type": "kementerian"},
            {"name": "Kementerian Dalam Negeri", "type": "kementerian"},
            {"name": "Kementerian Keuangan", "type": "kementerian"},
            {"name": "Kementerian Hukum dan HAM", "type": "kementerian"},
            {"name": "Kementerian Pendidikan dan Kebudayaan", "type": "kementerian"},
            {"name": "Sekretariat Kabinet", "type": "lembaga_pemerintah"},
            {"name": "Badan Perencanaan Pembangunan Nasional", "type": "lembaga_pemerintah"},
            {"name": "Bappenas", "type": "lembaga_pemerintah"},
            {"name": "Badan Pemeriksa Keuangan", "type": "lembaga_negara"},
            {"name": "KPK", "type": "lembaga_negara"},
            {"name": "Ombudsman", "type": "lembaga_negara"},
        ]

    def _default_regions(self) -> dict:
        return {
            "provinsi": ["DKI Jakarta", "Jawa Barat", "Jawa Timur", "Jawa Tengah"],
            "kota": ["Bandung", "Surabaya", "Jakarta", "Semarang"],
        }
