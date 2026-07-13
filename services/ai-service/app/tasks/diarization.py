"""
Diarization Celery Tasks
"""
import os
import asyncio
import logging
from celery import chain
from app.celery_app import celery_app, BaseTask

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, base=BaseTask, max_retries=3, default_retry_delay=60,
                 queue="diarization", acks_late=True)
def diarize_audio(self, meeting_id: str, audio_path: str, num_speakers: int = None):
    """
    Perform speaker diarization on audio file.
    Triggers NLP processing on completion.
    """
    logger.info(f"[diarize] meeting={meeting_id} speakers={num_speakers}")

    from app.services.diarization import DiarizationService

    class _MockFile:
        def __init__(self, path):
            self.filename = os.path.basename(path)
            self._path = path
        async def read(self):
            with open(self._path, "rb") as f:
                return f.read()

    svc = DiarizationService()
    mock = _MockFile(audio_path)

    result = asyncio.run(svc.diarize(file=mock, num_speakers=num_speakers))

    segments = [
        {
            "speaker_id": s.speaker_id,
            "speaker_name": s.speaker_name or s.speaker_id,
            "start_ms": s.start_ms,
            "end_ms": s.end_ms,
            "confidence": s.confidence,
        }
        for s in result.segments
    ]

    payload = {
        "meeting_id": meeting_id,
        "status": "completed",
        "num_speakers": result.num_speakers,
        "segments": segments,
    }

    # Next: NLP processing
    from app.tasks.nlp import process_transcript_nlp
    process_transcript_nlp.delay(meeting_id=meeting_id)

    logger.info(f"[diarize] done meeting={meeting_id} speakers={result.num_speakers}")
    return payload


@celery_app.task(bind=True, base=BaseTask, queue="diarization")
def merge_transcription_diarization(self, meeting_id: str,
                                    transcription_result: dict,
                                    diarization_result: dict):
    """Merge transcription lines with diarization speaker segments."""
    t_lines = transcription_result.get("lines", [])
    d_segs = diarization_result.get("segments", [])

    t_lines.sort(key=lambda x: x.get("timestamp_ms", 0))
    d_segs.sort(key=lambda x: x.get("start_ms", 0))

    merged = []
    for line in t_lines:
        ts = line.get("timestamp_ms", 0)
        speaker = "Unknown"
        speaker_id = None
        for seg in d_segs:
            if seg["start_ms"] <= ts <= seg["end_ms"]:
                speaker = seg.get("speaker_name", seg["speaker_id"])
                speaker_id = seg["speaker_id"]
                break
        merged.append({**line, "speaker": speaker, "speaker_id": speaker_id})

    return {"meeting_id": meeting_id, "status": "merged", "lines": merged}
