from fastapi import APIRouter
from app.models.schemas import MinutesRequest, MinutesResponse
from app.services.minutes_generator import MinutesGeneratorService

router = APIRouter()
minutes_service = MinutesGeneratorService()


@router.post("/generate", response_model=MinutesResponse)
async def generate_minutes(request: MinutesRequest):
    return minutes_service.generate(request)


@router.get("/templates")
async def list_templates():
    return minutes_service.list_templates()


@router.get("/templates/{template_type}")
async def get_template(template_type: str):
    return minutes_service.get_template(template_type)
