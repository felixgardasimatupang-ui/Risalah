from fastapi import APIRouter, UploadFile, File, Form
from app.models.schemas import DiarizationRequest, DiarizationResponse
from app.services.diarization import DiarizationService

router = APIRouter()
diarization_service = DiarizationService()


@router.post("/diarize", response_model=DiarizationResponse)
async def diarize_audio(
    file: UploadFile = File(...),
    num_speakers: int = Form(None),
):
    return await diarization_service.diarize(file, num_speakers)


@router.post("/diarize/from-path", response_model=DiarizationResponse)
async def diarize_from_path(request: DiarizationRequest):
    return await diarization_service.diarize_from_path(request)
