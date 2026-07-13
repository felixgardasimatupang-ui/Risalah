from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, transcription, diarization, nlp, government, context, minutes, chat, models, pipeline, meetings, export

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if settings.debug else "/docs",
    redoc_url="/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXCLUDE_AUTH_PATHS = {"/", "/api/v1/health", "/docs", "/openapi.json", "/redoc"}


@app.middleware("http")
async def api_key_middleware(request, call_next):
    if settings.api_key:
        if request.url.path not in EXCLUDE_AUTH_PATHS:
            key = request.headers.get("X-API-Key", "")
            if key != settings.api_key:
                from starlette.responses import JSONResponse
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Missing or invalid API key"},
                )
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(transcription.router, prefix="/api/v1/transcription", tags=["Transcription"])
app.include_router(diarization.router, prefix="/api/v1/diarization", tags=["Diarization"])
app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["NLP"])
app.include_router(government.router, prefix="/api/v1/government", tags=["Government Intelligence"])
app.include_router(context.router, prefix="/api/v1/context", tags=["Context Understanding"])
app.include_router(minutes.router, prefix="/api/v1/minutes", tags=["Minutes Generator"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI Chat / RAG"])
app.include_router(models.router, prefix="/api/v1", tags=["Models"])
app.include_router(pipeline.router, prefix="/api/v1", tags=["Pipeline"])
app.include_router(meetings.router, prefix="/api/v1", tags=["Meetings"])
app.include_router(export.router, prefix="/api/v1", tags=["Export"])


@app.get("/")
async def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
    }
