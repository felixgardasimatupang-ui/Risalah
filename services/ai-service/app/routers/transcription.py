from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from app.models.schemas import TranscriptionRequest, TranscriptionResponse
from app.services.whisperx_stt import whisperx_service
from app.config import settings

router = APIRouter()


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    meeting_id: str = Form(...),
    language: str = Form("id"),
    diarize: bool = Form(True),
):
    result = await whisperx_service.transcribe(
        file=file,
        meeting_id=meeting_id,
        language=language,
        diarize=diarize,
    )
    return result


@router.post("/transcribe/batch", response_model=TranscriptionResponse)
async def transcribe_batch(
    background_tasks: BackgroundTasks,
    request: TranscriptionRequest,
):
    background_tasks.add_task(whisperx_service.transcribe_batch, request)
    return TranscriptionResponse(
        meeting_id=request.meeting_id,
        status="processing",
        lines=[],
    )


@router.post("/transcribe/stream")
async def transcribe_stream():
    return {"status": "streaming endpoint ready (WebSocket)"}
