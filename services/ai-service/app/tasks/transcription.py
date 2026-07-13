"""
Transcription Celery Tasks
"""
import os
import asyncio
import logging
from celery import chain, group
from app.celery_app import celery_app, BaseTask

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, base=BaseTask, max_retries=3, default_retry_delay=60,
                 queue="transcription", acks_late=True)
def transcribe_audio(self, meeting_id: str, audio_path: str, language: str = "id"):
    """
    Transcribe audio file using WhisperX.
    Triggers diarization + NLP pipeline on completion.
    """
    logger.info(f"[transcribe] meeting={meeting_id} audio={audio_path} lang={language}")

    from app.services.whisperx_stt import WhisperXService

    class _MockFile:
        def __init__(self, path):
            self.filename = os.path.basename(path)
            self._path = path
        async def read(self):
            with open(self._path, "rb") as f:
                return f.read()

    svc = WhisperXService()
    mock = _MockFile(audio_path)

    result = asyncio.run(svc.transcribe(file=mock, meeting_id=meeting_id, language=language))

    if result.status.value == "failed":
        raise RuntimeError(f"Transcription failed: {result.error}")

    payload = {
        "meeting_id": meeting_id,
        "status": "completed",
        "lines": [l.model_dump() for l in (result.lines or [])],
        "duration_ms": result.duration_ms,
    }

    # Chain next steps: diarization → NLP
    from app.tasks.diarization import diarize_audio
    chain(
        diarize_audio.s(meeting_id=meeting_id, audio_path=audio_path),
    ).apply_async()

    logger.info(f"[transcribe] done meeting={meeting_id} lines={len(result.lines or [])}")
    return payload


@celery_app.task(bind=True, base=BaseTask, queue="transcription")
def transcribe_batch(self, meeting_ids: list, audio_dir: str):
    """Batch transcribe multiple audio files."""
    tasks = []
    for mid in meeting_ids:
        path = os.path.join(audio_dir, f"{mid}.wav")
        if os.path.exists(path):
            tasks.append(transcribe_audio.s(mid, path))
    if tasks:
        return group(tasks).apply_async()
    return {"status": "no_files_found"}


def create_transcription_pipeline(meeting_id: str, audio_path: str):
    """Full pipeline: transcribe → diarize → NLP → minutes → RAG index."""
    from app.tasks.diarization import diarize_audio
    from app.tasks.nlp import process_transcript_nlp
    from app.tasks.minutes import generate_minutes
    from app.tasks.rag import index_meeting_for_rag

    return chain(
        transcribe_audio.s(meeting_id, audio_path),
        diarize_audio.s(meeting_id, audio_path),
        process_transcript_nlp.s(meeting_id),
        generate_minutes.s(meeting_id, template_type="government"),
        index_meeting_for_rag.s(meeting_id),
    )
