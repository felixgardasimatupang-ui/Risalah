from fastapi import APIRouter
from app.models.schemas import ContextRequest, ContextResponse
from app.services.context_extractor import ContextExtractorService

router = APIRouter()
context_service = ContextExtractorService()


@router.post("/extract", response_model=ContextResponse)
async def extract_context(request: ContextRequest):
    return context_service.extract(request)


@router.post("/action-items")
async def extract_action_items(text: dict):
    return context_service.extract_action_items(text.get("text", ""))


@router.post("/decisions")
async def extract_decisions(text: dict):
    return context_service.extract_decisions(text.get("text", ""))
