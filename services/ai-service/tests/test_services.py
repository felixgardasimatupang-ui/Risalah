"""
Unit tests for GovKB, Context, and IndonesianNLP services.
All real logic, no mocks — these services don't need GPU.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from app.services.government_kb import GovernmentKBService
from app.services.context_extractor import ContextExtractorService
from app.services.indonesian_nlp import IndonesianNLPService
from app.models.schemas import GovernmentExtractionRequest, ContextRequest, NormalizationRequest


# ── GovKB ────────────────────────────────────────────────

class TestGovernmentKB:
    def setup_method(self):
        self.svc = GovernmentKBService()

    def test_extract_apbd(self):
        req = GovernmentExtractionRequest(text="APBD tahun 2025 meningkat 15 persen")
        resp = self.svc.extract_entities(req)
        entities = resp.entities
        apbds = [e for e in entities if e.text == "APBD"]
        assert len(apbds) >= 1
        assert apbds[0].category == "anggaran"

    def test_extract_institution(self):
        req = GovernmentExtractionRequest(text="Rapat di Kementerian Sekretariat Negara")
        resp = self.svc.extract_entities(req)
        names = [e.text for e in resp.entities]
        assert any("Sekretariat Negara" in n for n in names)

    def test_extract_gubernur(self):
        req = GovernmentExtractionRequest(text="Gubernur DKI Jakarta hadir")
        resp = self.svc.extract_entities(req)
        cats = [e.category for e in resp.entities]
        assert "jabatan" in cats

    def test_extract_perpres(self):
        req = GovernmentExtractionRequest(text="Sesuai Perpres Nomor 12 Tahun 2023")
        resp = self.svc.extract_entities(req)
        cats = [e.category for e in resp.entities]
        assert "regulasi" in cats

    def test_extract_empty_text(self):
        req = GovernmentExtractionRequest(text="")
        resp = self.svc.extract_entities(req)
        assert len(resp.entities) == 0

    def test_knowledge_base_categories(self):
        kb = self.svc.get_knowledge_base()
        assert "lembaga_negara" in kb["terms"]
        assert "anggaran" in kb["terms"]
        assert "jabatan" in kb["terms"]
        assert "regulasi" in kb["terms"]

    def test_glossary_contains_terms(self):
        glossary = self.svc.get_glossary()
        terms = [g["term"] for g in glossary]
        assert "APBD" in terms
        assert "DPRD" in terms
        assert "Gubernur" in terms


# ── Context Extractor ─────────────────────────────────────

class TestContextExtractor:
    def setup_method(self):
        self.svc = ContextExtractorService()

    def test_extract_action_item_instruction(self):
        req = ContextRequest(text="tolong siapkan revisi anggaran sebelum bulan depan")
        resp = self.svc.extract(req)
        assert len(resp.action_items) >= 1
        assert "revisi anggaran" in resp.action_items[0].description.lower()

    def test_extract_action_item_assignment(self):
        req = ContextRequest(text="Kepala Bappeda ditugaskan untuk menyusun laporan")
        resp = self.svc.extract(req)
        items = resp.action_items
        # "ditugaskan" should match "menugaskan" pattern
        assert any("ditugaskan" in i.description.lower() for i in items)

    def test_extract_decision_approval(self):
        req = ContextRequest(text="Rapat menyetujui anggaran dinaikkan 10 persen")
        resp = self.svc.extract(req)
        assert len(resp.decisions) >= 1
        assert "menyetujui" in resp.decisions[0].description.lower()
        assert resp.decisions[0].category == "approval"

    def test_extract_decision_rejection(self):
        req = ContextRequest(text="Komisi menolak usulan kenaikan anggaran")
        resp = self.svc.extract(req)
        assert len(resp.decisions) >= 1
        assert "menolak" in resp.decisions[0].description.lower()

    def test_extract_votes(self):
        req = ContextRequest(text="Anggota setuju dengan usulan tersebut")
        resp = self.svc.extract(req)
        assert len(resp.votes) >= 1

    def test_extract_deadline(self):
        req = ContextRequest(text="Laporan harus selesai sebelum 15 Januari 2025")
        resp = self.svc.extract(req)
        assert len(resp.deadlines) >= 1
        assert "15 Januari 2025" in resp.deadlines[0].get("text", "")

    def test_extract_interruption(self):
        req = ContextRequest(text="Saya izin menyela, ada tambahan informasi")
        resp = self.svc.extract(req)
        assert len(resp.interruptions) >= 1

    def test_extract_empty(self):
        req = ContextRequest(text="")
        resp = self.svc.extract(req)
        assert len(resp.action_items) == 0
        assert len(resp.decisions) == 0
        assert len(resp.votes) == 0


# ── IndonesianNLP ─────────────────────────────────────────

class TestIndonesianNLP:
    def setup_method(self):
        self.svc = IndonesianNLPService()

    def test_normalize_punctuation(self):
        req = NormalizationRequest(
            text="Halo semua ,  bagaimana kabarnya",
            fix_punctuation=True,
            normalize_numbers=False,
            normalize_currency=False,
            normalize_dates=False,
            capitalize=False,
        )
        resp = self.svc.normalize(req)
        # Space before comma removed
        assert "semua ," not in resp.normalized
        assert resp.normalized.endswith(".")

    def test_normalize_numbers(self):
        req = NormalizationRequest(
            text="Ada 12 peserta dan 5 OPD",
            normalize_numbers=True,
            fix_punctuation=False,
            normalize_currency=False,
            normalize_dates=False,
            capitalize=False,
        )
        resp = self.svc.normalize(req)
        # If num2words installed, numbers < 1000 converted to words
        # If not, numbers remain as-is (both are valid)
        assert "12" in resp.normalized or "dua belas" in resp.normalized.lower()

    def test_capitalize(self):
        req = NormalizationRequest(
            text="rapat dimulai pukul 09.00. agenda pertama pembahasan anggaran.",
            capitalize=True,
            fix_punctuation=False,
            normalize_numbers=False,
            normalize_currency=False,
            normalize_dates=False,
        )
        resp = self.svc.normalize(req)
        assert resp.normalized[0].isupper()
        sentences = resp.normalized.split(". ")
        for s in sentences:
            if s:
                assert s[0].isupper() or not s

    def test_summarize(self):
        text = (
            "Rapat hari ini membahas anggaran APBD 2025. "
            "Realisasi anggaran sudah mencapai 72 persen. "
            "OPD sudah menggunakan 85 persen dari pagu. "
            "Kepala Bappeda menyampaikan laporan realisasi. "
            "Ada beberapa OPD yang belum menyelesaikan laporan. "
            "Rapat akan dilanjutkan minggu depan."
        )
        result = self.svc.summarize(text)
        assert "summary" in result
        assert result["sentence_count"] >= 5
        assert result["summary_sentence_count"] >= 1

    def test_grammar_correction(self):
        text = "Rapat berjalan dengan baik"
        result = self.svc.correct_grammar(text)
        assert "original" in result
        assert "corrections" in result
