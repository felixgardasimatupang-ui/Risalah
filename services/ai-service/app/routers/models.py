from fastapi import APIRouter
from app.services.llm_client import NINE_ROUTER_MODELS

router = APIRouter()


@router.get("/models")
async def list_models():
    return {
        "models": [
            {"key": k, "model": v}
            for k, v in NINE_ROUTER_MODELS.items()
        ]
    }
