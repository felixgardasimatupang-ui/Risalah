"""
Celery Configuration for Async AI Pipeline Processing
"""
import os
import logging
from celery import Celery
from celery.signals import worker_ready, worker_shutdown
from kombu import Queue

logger = logging.getLogger(__name__)

# Celery app
celery_app = Celery(
    "risalah_ai",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1"),
    include=[
        "app.tasks.transcription",
        "app.tasks.diarization",
        "app.tasks.nlp",
        "app.tasks.minutes",
        "app.tasks.rag",
        "app.tasks.export",
        "app.tasks.maintenance",
    ],
)

# Configuration
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="Asia/Jakarta",
    enable_utc=True,
    
    # Task routing
    task_routes={
        "app.tasks.transcription.*": {"queue": "transcription"},
        "app.tasks.diarization.*": {"queue": "diarization"},
        "app.tasks.minutes.*": {"queue": "minutes"},
        "app.tasks.rag.*": {"queue": "rag"},
        "app.tasks.export.*": {"queue": "export"},
    },
    
    # Queue definitions
    task_queues={
        "transcription": Queue("transcription", routing_key="transcription"),
        "diarization": Queue("diarization", routing_key="diarization"),
        "minutes": Queue("minutes", routing_key="minutes"),
        "rag": Queue("rag", routing_key="rag"),
        "export": Queue("export", routing_key="export"),
        "default": Queue("default", routing_key="default"),
    },
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=10,
    worker_max_memory_per_child=2000000,  # 2GB
    
    # Task settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_track_started=True,
    
    # Result settings
    result_expires=86400,  # 24 hours
    result_compression="gzip",
    
    # Retry settings
    task_autoretry_for=(Exception,),
    task_retry_backoff=True,
    task_retry_backoff_max=600,
    task_retry_jitter=True,
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Beat schedule (for periodic tasks)
    beat_schedule={
        "cleanup-old-results": {
            "task": "app.tasks.maintenance.cleanup_old_results",
            "schedule": 3600.0,
        },
        "cleanup-temp-files": {
            "task": "app.tasks.maintenance.cleanup_temp_files",
            "schedule": 1800.0,
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks()


@celery_app.task(bind=True, ignore_result=True)
def debug_task(self):
    logger.debug("Request: %s", self.request)


# Worker lifecycle signals
@worker_ready.connect
def worker_ready_handler(sender=None, **kwargs):
    logger.info("Worker %s ready", sender.hostname)


@worker_shutdown.connect
def worker_shutdown_handler(sender=None, **kwargs):
    logger.info("Worker %s shutting down", sender.hostname)


# Task base class with common functionality
class BaseTask(celery_app.Task):
    """Base task with common error handling and logging"""
    
    abstract = True
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error("Task %s failed: %s", task_id, exc)
        super().on_failure(exc, task_id, args, kwargs, einfo)
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning("Task %s retrying: %s", task_id, exc)
        super().on_retry(exc, task_id, args, kwargs, einfo)
    
    def on_success(self, retval, task_id, args, kwargs):
        logger.info("Task %s succeeded", task_id)
        super().on_success(retval, task_id, args, kwargs)


# Export
__all__ = ["celery_app", "BaseTask"]