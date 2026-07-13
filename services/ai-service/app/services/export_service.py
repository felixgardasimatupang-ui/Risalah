"""
Export Service — render notulen ke DOCX format pemerintah Indonesia.
"""
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

from app.models.schemas import (
    Meeting, TranscriptLine, ActionItem, Decision, MinutesResponse,
    ContextResponse,
)


class ExportService:
    """Export meeting minutes to DOCX with Indonesian government format."""

    def export_to_docx(
        self,
        meeting: Meeting,
        transcript: list[TranscriptLine],
        action_items: list[ActionItem],
        decisions: list[Decision],
        minutes_content: dict,
        output_path: str,
    ) -> str:
        """Generate DOCX notulen. Returns output_path."""
        doc = Document()

        # Page setup
        section = doc.sections[0]
        section.top_margin = Cm(3)
        section.bottom_margin = Cm(3)
        section.left_margin = Cm(3)
        section.right_margin = Cm(3)

        self._add_header(doc, meeting)
        doc.add_paragraph()  # spacer

        # Participants
        if meeting.participant_count:
            self._add_section_title(doc, "PESERTA RAPAT")
            p = doc.add_paragraph(f"Jumlah peserta: {meeting.participant_count} orang")
            p.paragraph_format.space_after = Pt(6)

        # Transcript
        if transcript:
            self._add_section_title(doc, "TRANSCRIPT / PEMBAHASAN")
            for line in transcript:
                ts = f"[{line.timestamp_ms // 60000:02d}:{(line.timestamp_ms // 1000) % 60:02d}]"
                p = doc.add_paragraph()
                run = p.add_run(f"{ts} {line.speaker_name}: ")
                run.bold = True
                run.font.size = Pt(10)
                p.add_run(line.text).font.size = Pt(10)
                p.paragraph_format.space_after = Pt(2)

        # Decisions
        if decisions:
            self._add_section_title(doc, "KEPUTUSAN RAPAT")
            for d in decisions:
                doc.add_paragraph(d.description, style="List Bullet")

        # Action Items
        if action_items:
            self._add_section_title(doc, "TINDAK LANJUT")
            table = doc.add_table(rows=1, cols=4)
            table.style = "Light Grid Accent 1"
            table.alignment = WD_TABLE_ALIGNMENT.CENTER

            hdr = table.rows[0].cells
            hdr[0].text = "No"
            hdr[1].text = "Deskripsi"
            hdr[2].text = "PIC"
            hdr[3].text = "Deadline"

            for i, item in enumerate(action_items, 1):
                row = table.add_row().cells
                row[0].text = str(i)
                row[1].text = item.description
                row[2].text = item.pic or "-"
                row[3].text = item.deadline or "-"

        # Minutes content (sections from generator)
        if minutes_content and minutes_content.get("sections"):
            doc.add_page_break()
            self._add_section_title(doc, "NOTULA RAPAT")
            for key, section_data in minutes_content["sections"].items():
                if key in ("header", "participants", "pembahasan",
                           "keputusan", "tindak_lanjut", "penutup"):
                    continue  # already rendered above
                self._add_subsection_title(doc, section_data.get("title", key))
                doc.add_paragraph(section_data.get("content", ""))

        # Footer
        doc.add_paragraph()
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(f"Notulen ini digenerate oleh Risalah AI — {datetime.now().strftime('%d %B %Y %H:%M')}")
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(128, 128, 128)

        doc.save(output_path)
        return output_path

    def _add_header(self, doc: Document, meeting: Meeting):
        """Add Indonesian government-style header."""
        # Kop
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("NOTULA RAPAT")
        run.bold = True
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(0, 0, 0)

        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(meeting.title or "(Tanpa Judul)")
        run.bold = True
        run.font.size = Pt(13)

        info_lines = []
        if meeting.date:
            info_lines.append(f"Hari/Tanggal: {meeting.date}")
        if meeting.location:
            info_lines.append(f"Tempat: {meeting.location}")
        for line in info_lines:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run(line).font.size = Pt(10)

        # Garis pemisah
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("─" * 60)
        run.font.size = Pt(8)

    def _add_section_title(self, doc: Document, title: str):
        p = doc.add_paragraph()
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0, 51, 102)
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)

    def _add_subsection_title(self, doc: Document, title: str):
        p = doc.add_paragraph()
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(11)
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)


export_service = ExportService()
