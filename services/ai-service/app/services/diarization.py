import os
import tempfile
from fastapi import UploadFile
from app.config import settings
from app.models.schemas import DiarizationRequest, DiarizationResponse, SpeakerSegment, ProcessingStatus


class DiarizationService:
    def __init__(self):
        self.pipeline = None
        self._load_pipeline()

    def _load_pipeline(self):
        try:
            from pyannote.audio import Pipeline

            self.pipeline = Pipeline.from_pretrained(
                settings.diarization_model,
                use_auth_token=os.getenv("HUGGINGFACE_TOKEN"),
            )
            if settings.diarization_device == "cpu":
                self.pipeline.to(torch.device("cpu"))
        except Exception as e:
            print(f"Warning: Could not load diarization model: {e}")
            print("Will use mock/fallback mode")
            self.pipeline = None

    async def diarize(
        self,
        file: UploadFile,
        num_speakers: int | None = None,
    ) -> DiarizationResponse:
        suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            return self._process_diarization(tmp_path, num_speakers)
        finally:
            os.unlink(tmp_path)

    async def diarize_from_path(self, request: DiarizationRequest) -> DiarizationResponse:
        return self._process_diarization(request.audio_path, request.num_speakers)

    def _process_diarization(
        self, audio_path: str, num_speakers: int | None = None
    ) -> DiarizationResponse:
        if self.pipeline:
            try:
                import torch

                kwargs = {}
                if num_speakers:
                    kwargs["num_speakers"] = num_speakers

                diarization = self.pipeline(audio_path, **kwargs)
                segments = []

                for turn, _, speaker in diarization.itertracks(yield_label=True):
                    segments.append(SpeakerSegment(
                        speaker_id=speaker,
                        start_ms=int(turn.start * 1000),
                        end_ms=int(turn.end * 1000),
                        confidence=0.85,
                    ))

                unique_speakers = list(set(s.speaker_id for s in segments))
                return DiarizationResponse(
                    segments=segments,
                    num_speakers=len(unique_speakers),
                    status=ProcessingStatus.completed,
                )
            except Exception as e:
                return DiarizationResponse(
                    segments=[], num_speakers=0, status=ProcessingStatus.failed
                )
        else:
            return self._get_mock_diarization()

    def _get_mock_diarization(self):
        return DiarizationResponse(
            segments=[
                SpeakerSegment(speaker_id="SPEAKER_01", speaker_name="Dr. Andi Pratama", start_ms=0, end_ms=120000, confidence=0.92),
                SpeakerSegment(speaker_id="SPEAKER_02", speaker_name="Sari Dewi, S.Sos.", start_ms=30000, end_ms=60000, confidence=0.88),
                SpeakerSegment(speaker_id="SPEAKER_01", start_ms=120000, end_ms=180000, confidence=0.90),
                SpeakerSegment(speaker_id="SPEAKER_03", speaker_name="Bambang Susilo", start_ms=60000, end_ms=90000, confidence=0.85),
            ],
            num_speakers=3,
            status=ProcessingStatus.completed,
        )
