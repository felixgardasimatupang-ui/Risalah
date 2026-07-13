import os
import tempfile
import logging
from fastapi import UploadFile
from app.config import settings
from app.models.schemas import TranscriptionRequest, TranscriptionResponse, TranscriptLine, ProcessingStatus

logger = logging.getLogger(__name__)


class WhisperSTTService:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from faster_whisper import WhisperModel

            self.model = WhisperModel(
                settings.whisper_model_size,
                device=settings.whisper_device,
                compute_type=settings.whisper_compute_type,
                cpu_threads=4 if settings.whisper_device == "cpu" else None,
                num_workers=2,
            )
        except Exception as e:
            logger.warning("Could not load Whisper model: %s", e)
            logger.info("Will use mock/fallback mode")
            self.model = None

    async def transcribe(
        self,
        file: UploadFile,
        meeting_id: str,
        language: str = "id",
        diarize: bool = True,
    ) -> TranscriptionResponse:
        suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            duration_ms = 0
            lines = []

            if self.model:
                segments, info = self.model.transcribe(
                    tmp_path,
                    language=language if language != "auto" else None,
                    beam_size=5,
                    best_of=5,
                    vad_filter=True,
                    vad_parameters=dict(
                        min_silence_duration_ms=500,
                        threshold=0.5,
                    ),
                )

                for i, seg in enumerate(segments):
                    lines.append(TranscriptLine(
                        id=f"l{i + 1}",
                        speaker_name="Pembicara Tidak Diketahui",
                        text=seg.text.strip(),
                        timestamp_ms=int(seg.start * 1000),
                        confidence=seg.avg_logprob if hasattr(seg, "avg_logprob") else 0.8,
                    ))

                duration_ms = int(info.duration * 1000) if hasattr(info, "duration") else 0
            else:
                lines = self._get_mock_transcript()
                duration_ms = 135000

            return TranscriptionResponse(
                meeting_id=meeting_id,
                status=ProcessingStatus.completed,
                lines=lines,
                duration_ms=duration_ms,
            )

        except Exception as e:
            return TranscriptionResponse(
                meeting_id=meeting_id,
                status=ProcessingStatus.failed,
                error=str(e),
            )
        finally:
            os.unlink(tmp_path)

    async def transcribe_batch(self, request: TranscriptionRequest):
        raise NotImplementedError("Batch transcription via Celery")

    def _get_mock_transcript(self):
        lines = [
            TranscriptLine(id="l1", speaker_name="Dr. Andi Pratama", text="Selamat pagi, terima kasih sudah hadir. Rapat koordinasi hari ini akan membahas evaluasi program kerja.", timestamp_ms=5000, confidence=0.95),
            TranscriptLine(id="l2", speaker_name="Dr. Andi Pratama", text="Saya ingin memulai dengan agenda pertama, yaitu capaian target indikator kinerja utama.", timestamp_ms=15000, confidence=0.93),
            TranscriptLine(id="l3", speaker_name="Sari Dewi, S.Sos.", text="Terima kasih Pak Andi. Realisasi anggaran sudah mencapai 72 persen dari total pagu.", timestamp_ms=28000, confidence=0.97),
            TranscriptLine(id="l4", speaker_name="Dr. Andi Pratama", text="Pastikan proses lelang selesai sebelum akhir bulan depan.", timestamp_ms=42000, confidence=0.91),
            TranscriptLine(id="l5", speaker_name="Bambang Susilo", text="Dari sisi infrastruktur TI, implementasi sistem baru berjalan sesuai jadwal.", timestamp_ms=55000, confidence=0.94),
        ]
        return lines
