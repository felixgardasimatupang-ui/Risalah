from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class ProcessingStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# Transcription
class TranscriptionRequest(BaseModel):
    meeting_id: str
    language: Optional[str] = "id"
    diarize: bool = True
    num_speakers: Optional[int] = None


class TranscriptLine(BaseModel):
    id: str
    speaker_name: str
    text: str
    timestamp_ms: int
    confidence: float = Field(ge=0.0, le=1.0)
    is_verified: bool = False


class TranscriptionResponse(BaseModel):
    meeting_id: str
    status: ProcessingStatus
    lines: list[TranscriptLine] = []
    duration_ms: int = 0
    error: Optional[str] = None


# Diarization
class DiarizationRequest(BaseModel):
    audio_path: str
    num_speakers: Optional[int] = None


class SpeakerSegment(BaseModel):
    speaker_id: str
    speaker_name: Optional[str] = None
    start_ms: int
    end_ms: int
    confidence: float


class DiarizationResponse(BaseModel):
    segments: list[SpeakerSegment]
    num_speakers: int
    status: ProcessingStatus


# NLP / Normalization
class NormalizationRequest(BaseModel):
    text: str
    normalize_numbers: bool = True
    normalize_currency: bool = True
    normalize_dates: bool = True
    capitalize: bool = True
    fix_punctuation: bool = True


class NormalizationResponse(BaseModel):
    original: str
    normalized: str
    changes: list[dict] = []


# Government Intelligence
class GovernmentEntity(BaseModel):
    entity_type: str
    text: str
    normalized_text: str
    category: str
    confidence: float


class GovernmentExtractionRequest(BaseModel):
    text: str


class GovernmentExtractionResponse(BaseModel):
    entities: list[GovernmentEntity]


# Context Understanding
class ContextRequest(BaseModel):
    text: str


class ActionItem(BaseModel):
    id: str
    description: str
    pic: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None


class Decision(BaseModel):
    id: str
    description: str
    category: str  # approval, rejection, voting, instruction


class ContextResponse(BaseModel):
    action_items: list[ActionItem]
    decisions: list[Decision]
    votes: list[dict] = []
    interruptions: list[dict] = []
    deadlines: list[dict] = []


# Minutes
class MinutesRequest(BaseModel):
    meeting_id: str
    template_type: str  # dprd, pemerintah, kabupaten, kementerian, universitas, bumn, perusahaan
    title: str
    date: str
    location: str
    participants: list[dict]
    transcript: list[TranscriptLine]
    context: Optional[ContextResponse] = None


class MinutesResponse(BaseModel):
    meeting_id: str
    status: ProcessingStatus
    content: dict = {}
    error: Optional[str] = None


# RAG / Chat
class ChatRequest(BaseModel):
    session_id: str
    message: str
    meeting_ids: Optional[list[str]] = None
    model: str = "free-developer"
    top_k: int = 5


class Citation(BaseModel):
    source: str
    text: str
    score: float
    meeting_id: Optional[str] = None
    line_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    citations: list[Citation] = []


class IndexRequest(BaseModel):
    meeting_id: str
    text_chunks: list[dict[str, str]]


# Health
class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: dict[str, bool]
    gpu_available: bool


# ──────────────────────────────────────────────
# DB-mapped schemas (meeting CRUD)
# ──────────────────────────────────────────────

class Meeting(BaseModel):
    id: str
    title: str = ""
    date: str = ""
    location: str = ""
    language: str = "id"
    template_type: str = "government"
    status: ProcessingStatus = ProcessingStatus.pending
    audio_path: str = ""
    audio_duration_ms: int = 0
    participant_count: int = 0
    error_message: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""
