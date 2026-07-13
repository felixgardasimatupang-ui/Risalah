"""E2E tests for Pipeline Orchestrator — verifies full 8-step flow with mocks."""
import pytest
from app.services.pipeline_orchestrator import PipelineOrchestrator, PipelineConfig, PipelineStep


@pytest.mark.asyncio
async def test_pipeline_full_flow(sample_audio):
    """Happy path: all 8 steps succeed, return complete result."""
    config = PipelineConfig(
        language="id",
        diarize=True,
        generate_minutes=True,
        template_type="government",
    )
    orchestrator = PipelineOrchestrator()
    result = await orchestrator.run_pipeline(
        audio_path=sample_audio,
        meeting_id="test-001",
        config=config,
    )

    assert result.meeting_id == "test-001"
    assert result.status.value == "completed"
    assert result.error is None

    # Transcription
    assert result.transcription is not None
    assert result.transcription.status.value == "completed"
    assert len(result.transcription.lines) == 2
    assert "anggaran" in result.transcription.lines[0].text

    # Diarization
    assert result.diarization is not None
    assert result.diarization.num_speakers == 2
    assert len(result.diarization.segments) == 2

    # Context
    assert result.context is not None
    assert len(result.context.action_items) == 1
    assert len(result.context.decisions) == 1

    # Minutes
    assert result.minutes is not None
    assert result.minutes.status.value == "completed"
    assert "Notulen" in result.minutes.content["title"]


@pytest.mark.asyncio
async def test_pipeline_no_diarization(sample_audio):
    """Pipeline succeeds without diarization step."""
    config = PipelineConfig(language="id", diarize=False, generate_minutes=False)
    orchestrator = PipelineOrchestrator()
    result = await orchestrator.run_pipeline(
        audio_path=sample_audio,
        meeting_id="test-002",
        config=config,
    )

    assert result.status.value == "completed"
    assert result.transcription is not None
    assert result.diarization is None  # skipped


@pytest.mark.asyncio
async def test_pipeline_transcription_fails(sample_audio):
    """Pipeline handles transcription failure gracefully."""
    from unittest.mock import patch, AsyncMock

    with patch("app.services.pipeline_orchestrator.PipelineOrchestrator._step_transcription",
               AsyncMock(return_value=None)):
        config = PipelineConfig(language="id", diarize=False, generate_minutes=False)
        orchestrator = PipelineOrchestrator()
        result = await orchestrator.run_pipeline(
            audio_path=sample_audio,
            meeting_id="test-003",
            config=config,
        )

        assert result.status.value == "failed"
        assert result.transcription is None


@pytest.mark.asyncio
async def test_pipeline_keeps_steps_record(sample_audio):
    """Pipeline records each completed step."""
    config = PipelineConfig(language="id", diarize=False, generate_minutes=False)
    orchestrator = PipelineOrchestrator()
    result = await orchestrator.run_pipeline(
        audio_path=sample_audio,
        meeting_id="test-004",
        config=config,
    )

    expected = [
        PipelineStep.VAD,
        PipelineStep.NOISE_REDUCTION,
        PipelineStep.TRANSCRIPTION,
        PipelineStep.CONTEXT_ANALYSIS,
    ]
    assert result.completed_steps == expected


@pytest.mark.asyncio
async def test_pipeline_no_audio_file():
    """Pipeline handles missing file gracefully."""
    config = PipelineConfig(language="id", diarize=False, generate_minutes=False)
    orchestrator = PipelineOrchestrator()
    result = await orchestrator.run_pipeline(
        audio_path="/nonexistent/audio.wav",
        meeting_id="test-005",
        config=config,
    )

    assert result.status.value == "failed"
    assert result.error is not None
