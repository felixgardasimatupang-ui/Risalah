from fastapi import APIRouter
from app.models.schemas import NormalizationRequest, NormalizationResponse
from app.services.indonesian_nlp import IndonesianNLPService

router = APIRouter()
nlp_service = IndonesianNLPService()


@router.post("/normalize", response_model=NormalizationResponse)
async def normalize_text(request: NormalizationRequest):
    return nlp_service.normalize(request)


@router.post("/correct")
async def correct_grammar(text: dict):
    return nlp_service.correct_grammar(text.get("text", ""))


@router.post("/summarize")
async def summarize_text(text: dict):
    return nlp_service.summarize(text.get("text", ""))
