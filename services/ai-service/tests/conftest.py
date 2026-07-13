"""Pytest config — auto-mock heavy ML services for fast unit tests."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from unittest.mock import AsyncMock, MagicMock, patch
import pytest


@pytest.fixture(autouse=True)
def mock_ml_services():
    """Mock all ML-heavy services so tests run without GPU/models.

    Patches at the source module level where singletons are defined.
    """
    mocks = {}

    # VAD service mock (source: app.services.audio_preprocessing)
    vad_mock = MagicMock()
    vad_mock.remove_silence = AsyncMock(return_value="/tmp/vad_output.wav")
    mocks["vad"] = vad_mock

    # Noise reduction mock (source: app.services.audio_preprocessing)
    nr_mock = MagicMock()
    nr_mock.reduce_noise = MagicMock(return_value="/tmp/nr_output.wav")
    mocks["nr"] = nr_mock

    # WhisperX mock (source: app.services.whisperx_stt)
    whisper_mock = MagicMock()
    whisper_mock.transcribe = AsyncMock(return_value=_mock_transcription())
    whisper_mock._ensure_model = MagicMock()
    mocks["whisper"] = whisper_mock

    # Diarization mock (source: app.services.diarization)
    diar_mock = MagicMock()
    diar_mock.diarize = AsyncMock(return_value=_mock_diarization())
    diar_mock._ensure_pipeline = MagicMock()
    mocks["diar"] = diar_mock

    # GovKB mock (source: app.services.government_kb)
    gov_mock = MagicMock()
    gov_mock.extract_entities = MagicMock(return_value=_mock_gov_result())
    mocks["gov"] = gov_mock

    # Context extractor mock (source: app.services.context_extractor)
    ctx_mock = MagicMock()
    ctx_mock.extract = MagicMock(return_value=_mock_context())
    mocks["ctx"] = ctx_mock

    # Minutes generator mock (source: app.services.minutes_generator)
    min_mock = MagicMock()
    min_mock.generate = MagicMock(return_value=_mock_minutes())
    mocks["min"] = min_mock

    patches = [
        patch("app.services.audio_preprocessing.vad_service", vad_mock),
        patch("app.services.audio_preprocessing.noise_reduction_service", nr_mock),
        patch("app.services.whisperx_stt.WhisperXService", return_value=whisper_mock),
        patch("app.services.diarization.DiarizationService", return_value=diar_mock),
        patch("app.services.government_kb.GovernmentKBService", return_value=gov_mock),
        patch("app.services.context_extractor.ContextExtractorService", return_value=ctx_mock),
        patch("app.services.minutes_generator.MinutesGeneratorService", return_value=min_mock),
    ]

    for p in patches:
        p.start()

    yield mocks

    for p in patches:
        p.stop()


@pytest.fixture
def sample_audio(tmp_path):
    """Create a tiny valid WAV file for pipeline tests."""
    import wave
    import struct
    path = tmp_path / "test_audio.wav"
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(struct.pack("<h", 0) * 1600)  # 0.1s silence
    return str(path)


# ----------------------------------------------------------------
# Mock data factories — match app.models.schemas exactly
# ----------------------------------------------------------------

def _mock_transcription():
    from app.models.schemas import TranscriptionResponse, ProcessingStatus, TranscriptLine
    return TranscriptionResponse(
        meeting_id="test-123",
        status=ProcessingStatus.completed,
        lines=[
            TranscriptLine(
                id="seg-1",
                speaker_name="SPEAKER_00",
                text="Rapat hari ini membahas anggaran",
                timestamp_ms=0,
                confidence=0.95,
            ),
            TranscriptLine(
                id="seg-2",
                speaker_name="SPEAKER_01",
                text="Kita sepakati anggaran dinaikkan 10 persen",
                timestamp_ms=2000,
                confidence=0.92,
            ),
        ],
        duration_ms=4000,
    )


def _mock_diarization():
    from app.models.schemas import DiarizationResponse, SpeakerSegment, ProcessingStatus
    return DiarizationResponse(
        num_speakers=2,
        segments=[
            SpeakerSegment(speaker_id="SPEAKER_00", start_ms=0, end_ms=2000, confidence=0.98),
            SpeakerSegment(speaker_id="SPEAKER_01", start_ms=2000, end_ms=4000, confidence=0.97),
        ],
        status=ProcessingStatus.completed,
    )


def _mock_gov_result():
    from app.models.schemas import GovernmentExtractionResponse
    return GovernmentExtractionResponse(entities=[])


def _mock_context():
    from app.models.schemas import ContextResponse, ActionItem, Decision
    return ContextResponse(
        action_items=[
            ActionItem(
                id="ai-1",
                description="Menyiapkan revisi anggaran",
                pic="Biro Keuangan",
                deadline="2025-01-15",
                priority="high",
            )
        ],
        decisions=[
            Decision(
                id="dec-1",
                description="Anggaran dinaikkan 10%",
                category="approval",
            )
        ],
        votes=[{"setuju": 5, "tidak_setuju": 1, "abstain": 0}],
        interruptions=[],
        deadlines=[{"date": "2025-01-15", "description": "Revisi anggaran"}],
    )


def _mock_minutes():
    from app.models.schemas import MinutesResponse, ProcessingStatus
    return MinutesResponse(
        meeting_id="test-123",
        status=ProcessingStatus.completed,
        content={
            "title": "Notulen Rapat",
            "summary": "Rapat membahas anggaran 2025. Disepakati kenaikan 10%.",
            "decisions": ["Anggaran dinaikkan 10%"],
            "action_items": [
                {"task": "Menyiapkan revisi anggaran", "pic": "Biro Keuangan", "deadline": "2025-01-15"}
            ],
        },
    )
