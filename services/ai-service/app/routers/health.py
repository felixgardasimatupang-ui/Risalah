from fastapi import APIRouter
from app.config import settings
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    gpu_available = False
    try:
        import torch
        gpu_available = torch.cuda.is_available()
    except ImportError:
        pass

    models_loaded = {
        "whisper": False,
        "diarization": False,
        "embedding": False,
        "spacy": False,
    }

    try:
        from faster_whisper import WhisperModel
        models_loaded["whisper"] = True
    except ImportError:
        pass

    try:
        import spacy
        models_loaded["spacy"] = True
    except ImportError:
        pass

    return HealthResponse(
        status="ok",
        version=settings.app_version,
        models_loaded=models_loaded,
        gpu_available=gpu_available or settings.use_gpu,
    )
