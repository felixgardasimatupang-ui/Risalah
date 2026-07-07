import os
import json
from datetime import datetime
from pathlib import Path
from app.models.schemas import MinutesRequest, MinutesResponse, ProcessingStatus


class MinutesGeneratorService:
    def __init__(self):
        self.templates_dir = Path(__file__).parent.parent / "knowledge_base" / "templates"
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        self._init_templates()

    def generate(self, request: MinutesRequest) -> MinutesResponse:
        template = self._load_template(request.template_type)
        if not template:
            return MinutesResponse(
                meeting_id=request.meeting_id,
                status=ProcessingStatus.failed,
                error=f"Template '{request.template_type}' not found",
            )

        content = self._fill_template(template, request)
        return MinutesResponse(
            meeting_id=request.meeting_id,
            status=ProcessingStatus.completed,
            content=content,
        )

    def list_templates(self) -> dict:
        templates = {}
        for f in self.templates_dir.glob("*.json"):
            with open(f) as fh:
                templates[f.stem] = json.load(fh)
        return templates

    def get_template(self, template_type: str) -> dict | None:
        return self._load_template(template_type)

    def _load_template(self, template_type: str) -> dict | None:
        path = self.templates_dir / f"{template_type}.json"
        if path.exists():
            with open(path) as f:
                return json.load(f)
        return None

    def _fill_template(self, template: dict, request: MinutesRequest) -> dict:
        sections = {}
        for key, section_def in template.get("sections", {}).items():
            rendered = section_def.get("content", "")
            rendered = rendered.replace("{{title}}", request.title)
            rendered = rendered.replace("{{date}}", request.date)
            rendered = rendered.replace("{{location}}", request.location)
            rendered = rendered.replace("{{meeting_id}}", request.meeting_id)

            participants_text = "\n".join([
                f"- {p.get('name', '')} ({p.get('role', '')})"
                for p in request.participants
            ]) if request.participants else "-"
            rendered = rendered.replace("{{participants}}", participants_text)

            transcript_text = "\n".join([
                f"[{line.timestamp_ms // 60000:02d}:{(line.timestamp_ms // 1000) % 60:02d}] {line.speaker_name}: {line.text}"
                for line in request.transcript
            ]) if request.transcript else "-"
            rendered = rendered.replace("{{transcript}}", transcript_text)

            if request.context:
                action_items_text = "\n".join([
                    f"- {ai.description} (PIC: {ai.pic or '-'}, Deadline: {ai.deadline or '-'})"
                    for ai in request.context.action_items
                ]) if request.context.action_items else "-"
                rendered = rendered.replace("{{action_items}}", action_items_text)

                decisions_text = "\n".join([
                    f"- {d.description}"
                    for d in request.context.decisions
                ]) if request.context.decisions else "-"
                rendered = rendered.replace("{{decisions}}", decisions_text)

            sections[key] = {
                "title": section_def.get("title", key),
                "content": rendered,
            }

        return {
            "template_type": request.template_type,
            "title": request.title,
            "date_generated": datetime.now().isoformat(),
            "sections": sections,
        }

    def _init_templates(self):
        templates = {
            "dprd": {
                "name": "Notula Rapat DPRD",
                "description": "Format notula rapat Dewan Perwakilan Rakyat Daerah",
                "sections": {
                    "header": {"title": "KOP NOTULA", "content": "NOTULA RAPAT\n{{title}}\n\nHari/Tanggal: {{date}}\nTempat: {{location}}\n"},
                    "participants": {"title": "PESERTA RAPAT", "content": "{{participants}}\n"},
                    "agenda": {"title": "AGENDA", "content": "1. Pembukaan\n2. Pembahasan\n3. Kesimpulan\n4. Penutup\n"},
                    "pembahasan": {"title": "PEMBAHASAN", "content": "{{transcript}}\n"},
                    "keputusan": {"title": "KEPUTUSAN", "content": "{{decisions}}\n"},
                    "tindak_lanjut": {"title": "TINDAK LANJUT", "content": "{{action_items}}\n"},
                    "penutup": {"title": "PENUTUP", "content": "Rapat ditutup pada pukul {{time_end}}.\n\nNotulensi ini telah dibuat dan disahkan."},
                },
            },
            "pemerintah": {
                "name": "Notula Rapat Pemerintah",
                "description": "Format notula rapat instansi pemerintah daerah",
                "sections": {
                    "header": {"title": "KOP NOTULA", "content": "NOTULA RAPAT\n{{title}}\n\nHari/Tanggal: {{date}}\nTempat: {{location}}\n"},
                    "participants": {"title": "PESERTA", "content": "{{participants}}\n"},
                    "jalannya_rapat": {"title": "JALANNYA RAPAT", "content": "{{transcript}}\n"},
                    "kesimpulan": {"title": "KESIMPULAN", "content": "{{decisions}}\n"},
                    "tindak_lanjut": {"title": "TINDAK LANJUT", "content": "{{action_items}}\n"},
                },
            },
            "kementerian": {
                "name": "Notula Rapat Kementerian",
                "description": "Format notula rapat tingkat kementerian",
                "sections": {
                    "header": {"title": "HEADER", "content": "KEMENTERIAN {{kementrian}}\nNOTULA RAPAT\n{{title}}\n{{date}}\n"},
                    "peserta": {"title": "PESERTA", "content": "{{participants}}\n"},
                    "pembahasan": {"title": "PEMBAHASAN", "content": "{{transcript}}\n"},
                    "hasil": {"title": "HASIL RAPAT", "content": "{{decisions}}\n"},
                    "rencana_tindak": {"title": "RENCANA TINDAK LANJUT", "content": "{{action_items}}\n"},
                },
            },
            "kabupaten": {
                "name": "Notula Rapat Kabupaten/Kota",
                "description": "Format notula rapat tingkat kabupaten/kota",
                "sections": {
                    "header": {"title": "KOP", "content": "PEMERINTAH KABUPATEN {{kabupaten}}\nNOTULA RAPAT\n{{title}}\n{{date}}\n"},
                    "peserta": {"title": "PESERTA", "content": "{{participants}}\n"},
                    "materi": {"title": "MATERI RAPAT", "content": "{{transcript}}\n"},
                    "hasil": {"title": "HASIL RAPAT", "content": "{{decisions}}\n"},
                },
            },
            "universitas": {
                "name": "Notula Rapat Universitas",
                "description": "Format notula rapat lingkungan perguruan tinggi",
                "sections": {
                    "header": {"title": "KOP", "content": "NOTULA RAPAT\n{{title}}\n{{date}}\nLokasi: {{location}}\n"},
                    "peserta": {"title": "PESERTA", "content": "{{participants}}\n"},
                    "acara": {"title": "ACARA", "content": "{{transcript}}\n"},
                    "keputusan": {"title": "KEPUTUSAN", "content": "{{decisions}}\n"},
                    "tugas": {"title": "TUGAS DAN TANGGUNG JAWAB", "content": "{{action_items}}\n"},
                },
            },
            "bumn": {
                "name": "Notula Rapat BUMN/BUMD",
                "description": "Format notula rapat Badan Usaha Milik Negara/Daerah",
                "sections": {
                    "header": {"title": "HEADER", "content": "NOTULA RAPAT\n{{title}}\n{{date}}\nLokasi: {{location}}\n"},
                    "peserta": {"title": "PESERTA", "content": "{{participants}}\n"},
                    "agenda_bisnis": {"title": "AGENDA BISNIS", "content": "{{transcript}}\n"},
                    "keputusan_bisnis": {"title": "KEPUTUSAN", "content": "{{decisions}}\n"},
                    "action_plan": {"title": "ACTION PLAN", "content": "{{action_items}}\n"},
                },
            },
            "perusahaan": {
                "name": "Notula Rapat Perusahaan",
                "description": "Format notula rapat perusahaan swasta",
                "sections": {
                    "header": {"title": "HEADER", "content": "NOTULA RAPAT\n{{title}}\n{{date}}\nLokasi: {{location}}\n"},
                    "attendees": {"title": "ATTENDEES", "content": "{{participants}}\n"},
                    "discussion": {"title": "DISCUSSION", "content": "{{transcript}}\n"},
                    "decisions": {"title": "DECISIONS", "content": "{{decisions}}\n"},
                    "action_items": {"title": "ACTION ITEMS", "content": "{{action_items}}\n"},
                },
            },
        }

        for name, template in templates.items():
            path = self.templates_dir / f"{name}.json"
            if not path.exists():
                with open(path, "w") as f:
                    json.dump(template, f, indent=2)
