"""
Minutes Generation Celery Tasks
"""
import logging
from celery import chain
from app.celery_app import celery_app, BaseTask
from app.models.schemas import MinutesRequest

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, base=BaseTask, max_retries=3, default_retry_delay=30,
                 queue="minutes", acks_late=True)
def generate_minutes(self, meeting_id: str, template_type: str = "government"):
    """
    Generate meeting minutes from transcript + context.
    Triggers RAG indexing on completion.
    """
    logger.info(f"[minutes] start meeting={meeting_id} template={template_type}")

    from app.services.minutes_generator import MinutesGeneratorService
    svc = MinutesGeneratorService()

    # Build request (in production, fetch from DB)
    req = MinutesRequest(
        meeting_id=meeting_id,
        template_type=template_type,
        title="Meeting",
        date="",
        location="",
        participants=[],
        transcript=[],
    )

    result = svc.generate(req)

    if result.status.value == "failed":
        raise RuntimeError(f"Minutes generation failed: {result.error}")

    payload = {
        "meeting_id": meeting_id,
        "status": "completed",
        "template_type": template_type,
        "content": result.content,
    }

    # Next: index for RAG
    from app.tasks.rag import index_meeting_for_rag
    index_meeting_for_rag.delay(meeting_id=meeting_id)

    logger.info(f"[minutes] done meeting={meeting_id}")
    return payload


@celery_app.task(bind=True, base=BaseTask, queue="minutes")
def regenerate_minutes(self, meeting_id: str, template_type: str = "government"):
    """Regenerate minutes (e.g. after transcript edit)."""
    return generate_minutes(meeting_id, template_type)
