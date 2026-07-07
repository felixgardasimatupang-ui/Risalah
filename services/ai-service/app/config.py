from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    app_name: str = "Risalah AI Service"
    app_version: str = "1.0.0"
    debug: bool = False

    # Model paths
    whisper_model_size: Literal["tiny", "base", "small", "medium", "large", "large-v3"] = "large-v3"
    whisper_device: Literal["cpu", "cuda", "mps"] = "cpu"
    whisper_compute_type: Literal["float16", "int8", "float32"] = "float16"

    # Diarization
    diarization_model: str = "pyannote/speaker-diarization-3.1"
    diarization_device: Literal["cpu", "cuda"] = "cpu"

    # Embedding
    embedding_model: str = "BAAI/bge-m3"
    embedding_device: Literal["cpu", "cuda"] = "cpu"

    # Vector DB
    vector_db_path: str = "/data/vector_db"

    # Celery / Queue
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    # Storage
    audio_storage_path: str = "/data/audio"
    transcript_storage_path: str = "/data/transcripts"
    export_storage_path: str = "/data/exports"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    max_upload_size: int = 500 * 1024 * 1024  # 500MB

    # CORS
    cors_origins: list[str] = ["*"]

    # GPU
    use_gpu: bool = False
    gpu_memory_limit: int = 8  # GB

    # 9router LLM Proxy
    nine_router_base: str = "http://localhost:20128/v1"
    nine_router_model: str = "free-developer"

    model_config = {"env_prefix": "RISALAH_", "env_file": ".env"}


settings = Settings()
