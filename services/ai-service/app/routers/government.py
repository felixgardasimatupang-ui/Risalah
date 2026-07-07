from fastapi import APIRouter
from app.models.schemas import GovernmentExtractionRequest, GovernmentExtractionResponse
from app.services.government_kb import GovernmentKBService

router = APIRouter()
gov_service = GovernmentKBService()


@router.post("/extract", response_model=GovernmentExtractionResponse)
async def extract_government_entities(request: GovernmentExtractionRequest):
    return gov_service.extract_entities(request)


@router.get("/knowledge-base")
async def get_knowledge_base(category: str = None):
    return gov_service.get_knowledge_base(category)


@router.get("/glossary")
async def get_glossary():
    return gov_service.get_glossary()
