"""
Celery configuration for Risalah AI Service
"""
from app.config import settings

# Broker & Backend
broker_url = settings.celery_broker_url
result_backend = settings.celery_result_backend

# Serialization
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]

# Timezone
timezone = "Asia/Jakarta"
enable_utc = True

# Task execution
task_track_started = True
task_time_limit = 3600
task_soft_time_limit = 3300
task_acks_late = True
worker_prefetch_multiplier = 1

# Result backend
result_expires = 86400  # 24 hours
result_extended = True

# Worker
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 100
worker_disable_rate_limits = False

# Queues
task_routes = {
    "app.tasks.transcription.*": {"queue": "transcription"},
    "app.tasks.diarization.*": {"queue": "diarization"},
    "app.tasks.nlp.*": {"queue": "nlp"},
    "app.tasks.minutes.*": {"queue": "minutes"},
    "app.tasks.chat.*": {"queue": "chat"},
    "app.tasks.cleanup.*": {"queue": "cleanup"},
}

# Task annotations
task_annotations = {
    "*": {
        "rate_limit": "10/m",
        "time_limit": 3600,
        "soft_time_limit": 3300,
    }
}

# Beat schedule
beat_schedule = {
    "cleanup-temp-files": {
        "task": "app.tasks.cleanup_temp_files_task",
        "schedule": 3600.0,  # Every hour
    },
}

# Monitoring
worker_send_task_events = True
task_send_sent_event = True

# Security
task_serializer = "json"
result_serializer = "json"

# Result compression
result_compression = "gzip"