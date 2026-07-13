"""
Pipeline API Router — run full AI pipeline from upload or existing audio
"""
import os
import tempfile
import logging
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks

from app.models.schemas import ProcessingStatus
from app.services.pipeline_orchestrator import PipelineOrchestrator, PipelineConfig

logger = logging.getLogger(__name__)

router = APIRouter()
orchestrator = PipelineOrchestrator()


@router.post("/pipeline/run", summary="Run full AI pipeline on uploaded audio")
async def run_pipeline(
    file: UploadFile = File(...),
    meeting_id: str = Form(...),
    language: str = Form("id"),
    diarize: bool = Form(True),
    generate_minutes: bool = Form(True),
    template_type: str = Form("government"),
    background_tasks: BackgroundTasks = None,
):
    """
    Run the complete AI pipeline on an audio file:
    VAD → NoiseReduce → WhisperX → Pyannote → GovKB → Context → Minutes → RAG

    Returns pipeline result with transcription, diarization, context, and minutes.
    """
    # Save uploaded file to temp
    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        audio_path = tmp.name

    config = PipelineConfig(
        language=language,
        diarize=diarize,
        generate_minutes=generate_minutes,
        template_type=template_type,
    )

    try:
        result = await orchestrator.run_pipeline(
            audio_path=audio_path,
            meeting_id=meeting_id,
            config=config,
        )

        return _build_response(result)
    finally:
        if os.path.exists(audio_path):
            os.unlink(audio_path)


@router.post("/pipeline/run-from-path", summary="Run pipeline from existing audio path")
async def run_pipeline_from_path(
    meeting_id: str,
    audio_path: str,
    language: str = "id",
    diarize: bool = True,
    generate_minutes: bool = True,
    template_type: str = "government",
):
    """Run pipeline from an existing audio file path on the server."""
    config = PipelineConfig(
        language=language,
        diarize=diarize,
        generate_minutes=generate_minutes,
        template_type=template_type,
    )

    result = await orchestrator.run_pipeline(
        audio_path=audio_path,
        meeting_id=meeting_id,
        config=config,
    )

    return _build_response(result)


def _build_response(result):
    """Convert PipelineResult to serializable dict."""
    resp = {
        "meeting_id": result.meeting_id,
        "status": result.status.value,
    }

    if result.error:
        resp["error"] = result.error

    if result.transcription:
        t = result.transcription
        resp["transcription"] = {
            "status": t.status.value,
            "lines": [l.model_dump() for l in (t.lines or [])],
            "duration_ms": t.duration_ms,
        }

    if result.diarization:
        d = result.diarization
        resp["diarization"] = {
            "num_speakers": d.num_speakers,
            "segments": [
                {
                    "speaker_id": s.speaker_id,
                    "speaker_name": s.speaker_name,
                    "start_ms": s.start_ms,
                    "end_ms": s.end_ms,
                    "confidence": s.confidence,
                }
                for s in d.segments
            ],
        }

    if result.context:
        c = result.context
        resp["context"] = {
            "action_items": [a.model_dump() for a in c.action_items],
            "decisions": [d.model_dump() for d in c.decisions],
            "votes": c.votes,
            "interruptions": c.interruptions,
            "deadlines": c.deadlines,
        }

    if result.minutes:
        m = result.minutes
        resp["minutes"] = {
            "status": m.status.value,
            "content": m.content,
        }

    return resp


@router.post("/pipeline/async", summary="Trigger async pipeline via Celery")
async def run_pipeline_async(
    meeting_id: str,
    audio_path: str,
    language: str = "id",
):
    """Trigger the full pipeline asynchronously via Celery."""
    try:
        from app.celery_app import celery_app
        from app.tasks.transcription import create_transcription_pipeline

        pipeline_chain = create_transcription_pipeline(meeting_id, audio_path)
        task = pipeline_chain.apply_async()

        return {
            "meeting_id": meeting_id,
            "status": "processing",
            "task_id": task.id,
        }
    except Exception as e:
        return {
            "meeting_id": meeting_id,
            "status": "failed",
            "error": str(e),
        }
