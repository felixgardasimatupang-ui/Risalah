"""
Maintenance Celery Tasks (periodic / beat)
"""
import os
import time
import logging
from app.celery_app import celery_app, BaseTask

logger = logging.getLogger(__name__)

TEMP_DIRS = [
    "/data/audio",
    "/data/transcripts",
    "/data/exports",
]

MAX_AGE_SECONDS = 86400  # 24h


@celery_app.task(bind=True, base=BaseTask, queue="default")
def cleanup_old_results(self):
    """Remove stale Celery result keys from Redis."""
    logger.info("[maintenance] cleaning old Celery results")
    try:
        from app.celery_app import celery_app as app
        backend = app.backend
        if hasattr(backend, "cleanup"):
            backend.cleanup()
    except Exception as e:
        logger.warning(f"[maintenance] cleanup results error: {e}")
    return {"status": "ok", "task": "cleanup_old_results"}


@celery_app.task(bind=True, base=BaseTask, queue="default")
def cleanup_temp_files(self):
    """Remove temp files older than MAX_AGE_SECONDS."""
    logger.info("[maintenance] cleaning temp files")
    now = time.time()
    removed = 0
    for d in TEMP_DIRS:
        if not os.path.isdir(d):
            continue
        for fname in os.listdir(d):
            fpath = os.path.join(d, fname)
            try:
                if os.path.isfile(fpath) and now - os.path.getmtime(fpath) > MAX_AGE_SECONDS:
                    os.remove(fpath)
                    removed += 1
            except Exception:
                pass
    logger.info(f"[maintenance] removed {removed} temp files")
    return {"status": "ok", "files_removed": removed}
