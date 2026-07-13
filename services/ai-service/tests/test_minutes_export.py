"""
Unit tests for MinutesGenerator and ExportService.
Real logic — no mocks needed.
"""
import os
import sys
import tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from app.services.minutes_generator import MinutesGeneratorService
from app.services.export_service import ExportService
from app.models.schemas import (
    MinutesRequest, TranscriptLine, ContextResponse,
    ActionItem, Decision, Meeting, ProcessingStatus,
)


class TestMinutesGenerator:
    def setup_method(self):
        self.svc = MinutesGeneratorService()

    def test_list_templates(self):
        templates = self.svc.list_templates()
        assert "pemerintah" in templates
        assert "dprd" in templates
        assert "kementerian" in templates
        assert "bumn" in templates
        assert "perusahaan" in templates
        assert "kabupaten" in templates
        assert "universitas" in templates

    def test_generate_pemerintah(self):
        req = MinutesRequest(
            meeting_id="test-001",
            template_type="pemerintah",
            title="Rapat Koordinasi",
            date="15 Januari 2025",
            location="Gedung Utama",
            participants=[{"name": "Andi", "role": "Ketua"}],
            transcript=[
                TranscriptLine(id="l1", speaker_name="Andi", text="Selamat pagi", timestamp_ms=0, confidence=0.95),
            ],
            context=ContextResponse(
                action_items=[
                    ActionItem(id="ai-1", description="Revisi anggaran", pic="Biro Keuangan",
                               deadline="2025-02-01", priority="high"),
                ],
                decisions=[
                    Decision(id="dec-1", description="Anggaran disetujui", category="approval"),
                ],
                votes=[], interruptions=[], deadlines=[],
            ),
        )
        resp = self.svc.generate(req)
        assert resp.status == ProcessingStatus.completed
        assert resp.content["template_type"] == "pemerintah"
        assert resp.content["title"] == "Rapat Koordinasi"
        assert "sections" in resp.content
        assert "header" in resp.content["sections"]
        assert "tindak_lanjut" in resp.content["sections"]

    def test_generate_dprd(self):
        req = MinutesRequest(
            meeting_id="test-002",
            template_type="dprd",
            title="Paripurna DPRD",
            date="20 Januari 2025",
            location="Gedung DPRD",
            participants=[],
            transcript=[],
            context=None,
        )
        resp = self.svc.generate(req)
        assert resp.status == ProcessingStatus.completed
        assert "pembahasan" in resp.content["sections"]
        assert "keputusan" in resp.content["sections"]

    def test_generate_bumn(self):
        req = MinutesRequest(
            meeting_id="test-003",
            template_type="bumn",
            title="RUPS PT ABC",
            date="10 Januari 2025",
            location="Kantor Pusat",
            participants=[],
            transcript=[],
            context=None,
        )
        resp = self.svc.generate(req)
        assert resp.status == ProcessingStatus.completed
        assert "action_plan" in resp.content["sections"]

    def test_generate_invalid_template(self):
        req = MinutesRequest(
            meeting_id="test-004",
            template_type="tidak_ada",
            title="Test",
            date="",
            location="",
            participants=[],
            transcript=[],
            context=None,
        )
        resp = self.svc.generate(req)
        assert resp.status == ProcessingStatus.failed
        assert "not found" in resp.error

    def test_get_template(self):
        tmpl = self.svc.get_template("pemerintah")
        assert tmpl is not None
        assert tmpl["name"] == "Notula Rapat Pemerintah"
        assert "sections" in tmpl

    def test_generate_without_context(self):
        req = MinutesRequest(
            meeting_id="test-005",
            template_type="perusahaan",
            title="Meeting",
            date="",
            location="",
            participants=[],
            transcript=[
                TranscriptLine(id="l1", speaker_name="A", text="Hello", timestamp_ms=0, confidence=0.9),
            ],
            context=None,
        )
        resp = self.svc.generate(req)
        assert resp.status == ProcessingStatus.completed


class TestExportService:
    def setup_method(self):
        self.svc = ExportService()

    def test_export_docx(self):
        meeting = Meeting(
            id="exp-001",
            title="Rapat Export Test",
            date="15 Januari 2025",
            location="Jakarta",
            status=ProcessingStatus.completed,
        )
        lines = [
            TranscriptLine(id="l1", speaker_name="Andi", text="Test export", timestamp_ms=0, confidence=0.95),
        ]
        items = [
            ActionItem(id="ai-1", description="Task A", pic="PIC", deadline="2025-06-01", priority="high"),
        ]
        decisions = [
            Decision(id="dec-1", description="Decision A", category="approval"),
        ]
        minutes_content = {
            "title": "Notulen",
            "sections": {
                "kesimpulan": {"title": "KESIMPULAN", "content": "Anggaran disetujui"},
            },
        }

        tmp = tempfile.NamedTemporaryFile(suffix=".docx", delete=False)
        tmp.close()
        try:
            out = self.svc.export_to_docx(meeting, lines, items, decisions, minutes_content, tmp.name)
            assert os.path.exists(out)
            assert os.path.getsize(out) > 1000

            # Verify DOCX structure
            import zipfile
            with zipfile.ZipFile(out) as z:
                assert "word/document.xml" in z.namelist()
                assert "[Content_Types].xml" in z.namelist()
        finally:
            if os.path.exists(tmp.name):
                os.unlink(tmp.name)
