# Technical Documentation — Risalah AI Service

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RISALAH AI SERVICE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │  Client  │───▶│  FastAPI    │───▶│  Celery      │───▶│  Workers       │ │
│  │  (REST)  │    │  Gateway    │    │  (Redis)     │    │  (Async)       │ │
│  └──────────┘    └──────┬──────┘    └──────┬───────┘    └───────┬────────┘ │
│                         │                   │                   │          │
│                         ▼                   ▼                   ▼          │
│                  ┌──────────────┐    ┌──────────────┐    ┌────────────┐  │
│                  │   SQLite/    │    │  Knowledge   │    │   Models   │  │
│                  │  PostgreSQL  │    │  Bases (JSON)│    │  (Lazy Load)│ │
│                  └──────────────┘    └──────────────┘    └────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Structure

```
app/
├── main.py                 # FastAPI app + middleware + router registration
├── config.py               # Pydantic Settings (env-driven)
├── database.py             # Async SQLAlchemy engine + session
├── models/
│   ├── db_models.py        # SQLAlchemy ORM models (5 tables)
│   └── schemas.py          # Pydantic request/response models
├── repositories/
│   └── meeting_repo.py     # CRUD + query operations
├── services/
│   ├── whisperx_stt.py     # WhisperX transcription + alignment
│   ├── whisper_stt.py      # Faster-Whisper fallback
│   ├── silero_vad.py       # Voice Activity Detection
│   ├── noise_reduction.py  # noisereduce/rnnoise
│   ├── diarization.py      # PyAnnote speaker diarization
│   ├── audio_preprocessing.py  # Facade: VAD + NR
│   ├── indonesian_nlp.py   # spaCy + custom rules
│   ├── government_kb.py    # Government entity extraction
│   ├── context_extractor.py    # Regex + pattern matching
│   ├── minutes_generator.py    # DOCX generation (Jinja2)
│   ├── export_service.py       # DOCX file output
│   ├── rag_engine.py         # ChromaDB + embeddings + LLM
│   ├── llm_client.py         # 9router LLM proxy client
│   └── pipeline_orchestrator.py # 8-step pipeline coordinator
├── tasks/
│   ├── transcription.py
│   ├── diarization.py
│   ├── nlp.py
│   ├── minutes.py
│   ├── rag.py
│   ├── export.py
│   └── maintenance.py
├── routers/
│   ├── health.py
│   ├── transcription.py
│   ├── diarization.py
│   ├── nlp.py
│   ├── government.py
│   ├── context.py
│   ├── minutes.py
│   ├── chat.py
│   ├── models.py
│   ├── pipeline.py
│   ├── meetings.py
│   └── export.py
├── celery_app.py           # Celery config + BaseTask
├── celery_config.py        # Queue routing + beat schedule
└── skills/                 # Extensible skill system
```

## Database Schema

```sql
-- meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    date DATE,
    location VARCHAR(255),
    status VARCHAR(50),           -- pending/processing/completed/failed
    audio_path VARCHAR(500),
    duration_ms INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- transcript_lines
CREATE TABLE transcript_lines (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    speaker_name VARCHAR(100),
    speaker_id VARCHAR(50),
    text TEXT,
    timestamp_ms INTEGER,
    confidence FLOAT,
    word_timestamps JSONB,        -- [{"word": "...", "start": 0.0, "end": 1.0, "confidence": 0.9}]
    sequence INTEGER
);

-- action_items
CREATE TABLE action_items (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    description TEXT,
    pic VARCHAR(100),
    deadline DATE,
    priority VARCHAR(20),         -- high/medium/low
    status VARCHAR(20),           -- pending/in_progress/done
    created_at TIMESTAMP
);

-- decisions
CREATE TABLE decisions (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    description TEXT,
    category VARCHAR(50),         -- approval/rejection/agreement/etc
    created_at TIMESTAMP
);

-- minutes
CREATE TABLE minutes (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    template_type VARCHAR(50),
    content JSONB,                -- structured minutes content
    docx_path VARCHAR(500),       -- generated DOCX file path
    status VARCHAR(50),           -- draft/generated/approved
    created_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_transcript_meeting ON transcript_lines(meeting_id);
CREATE INDEX idx_action_meeting ON action_items(meeting_id);
CREATE INDEX idx_decisions_meeting ON decisions(meeting_id);
CREATE INDEX idx_minutes_meeting ON minutes(meeting_id);
```

## Pipeline Orchestration (8 Steps)

```python
# pipeline_orchestrator.py - PipelineConfig controls flow
class PipelineConfig:
    language: str = "id"
    diarize: bool = True
    generate_minutes: bool = True
    template_type: str = "government"
    noise_reduce: bool = True
    vad_threshold: float = 0.5

# Step sequence:
# 1. AUDIO_PREPROCESS    → noise_reduce + VAD (16kHz resample)
# 2. TRANSCRIBE          → WhisperX (batched) + word timestamps
# 3. DIARIZE             → PyAnnote + speaker embeddings
# 4. MERGE               → Align transcript segments with speakers
# 5. NLP_PROCESS         → Normalize + GovKB extract + Context extract
# 6. GENERATE_MINUTES    → Template rendering → DOCX
# 7. RAG_INDEX           → Chunk + embed + index to ChromaDB
# 8. CLEANUP             → Remove temp files
```

## Service Details

### 1. WhisperX STT (`whisperx_stt.py`)

```python
class WhisperXService:
    - model: WhisperModel (faster-whisper)
    - align_model: whisperx.load_align_model
    - transcribe()          → segments + word_timestamps
    - _align_whisperx()     → word-level timestamps
    - _process_segments()   → TranscriptLine objects

# Lazy load: model loaded on first transcribe() call
# GPU: auto-detect CUDA, fallback to CPU int8
```

### 2. PyAnnote Diarization (`diarization.py`)

```python
class DiarizationService:
    - pipeline: Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
    - embedding_model: SpeechBrain ECAPA-TDNN
    - diarize()              → SpeakerSegment[]
    - extract_embeddings()   → speaker embeddings for re-ID
    - merge_transcription_diarization()  → align timestamps
```

### 3. Indonesian NLP (`indonesian_nlp.py`)

```python
class IndonesianNLPService:
    - nlp: spacy.load("id_core_news_sm")
    - normalize()           → numbers, currency, dates, punctuation
    - correct_grammar()     → rule-based fixes
    - summarize()           → extractive (top sentences by TF-IDF)
    - word_to_number()      → "dua belas" → 12 (if num2words installed)
```

### 4. Government KB (`government_kb.py`)

```python
class GovernmentKBService:
    - terms: Dict[category, Dict[term, info]]  # loaded from JSON
    - institutions: List[dict]                  # from JSON
    - regions: Dict[str, List[str]]             # from JSON
    - extract_entities()    → GovernmentEntity[] (regex match)
    - get_knowledge_base()  → nested dict by category
    - get_glossary()        → flat list for UI

# Categories: lembaga_negara, struktur_pemerintahan, anggaran, jabatan, regulasi, wilayah
```

### 5. Context Extractor (`context_extractor.py`)

```python
class ContextExtractorService:
    - extract_action_items()   → regex patterns (instruction, assignment, follow_up, PIC)
    - extract_decisions()      → approval/rejection/agreement/instruction
    - extract_votes()          → setuju/tidak setuju/abstain/voting
    - extract_interruptions()  → izin menyela/interupsi
    - extract_deadlines()      → date patterns + relative dates
```

### 6. Minutes Generator (`minutes_generator.py`)

```python
class MinutesGeneratorService:
    - templates: Dict[type, Jinja2 template]
    - generate()          → renders DOCX via python-docx
    - _render_government() → Kop surat + header + tabel tindak lanjut + keputusan + tanda tangan
    - _render_dprd()       → DPRD format
    - _render_bumn()       → BUMN format
```

### 7. RAG Engine (`rag_engine.py`)

```python
class RAGEngineService:
    - embeddings: HuggingFaceEmbeddings (BGE-M3)
    - vector_store: Chroma (persistent)
    - index_meeting()        → chunk transcript → embed → store
    - query()                → similarity search + LLM answer
    - delete_index()         → cleanup
    - _fallback_answer()     → template-based if LLM fails
```

### 8. Pipeline Orchestrator (`pipeline_orchestrator.py`)

```python
class PipelineOrchestrator:
    - run_pipeline()         → async, runs 8 steps sequentially
    - Each step: try/except → record status → continue or fail
    - Saves progress to DB after each step
    - Returns PipelineResult with all outputs
```

## Celery Task Design

```python
# Base task with retry + logging
class BaseTask(Task):
    autoretry_for = (Exception,)
    retry_backoff = True
    retry_backoff_max = 600
    retry_jitter = True
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning(f"Task {task_id} retrying: {exc}")

# Task routing:
# transcription.* → queue: transcription
# diarization.*   → queue: diarization
# nlp.*           → queue: nlp
# minutes.*       → queue: minutes
# rag.*           → queue: rag
# export.*        → queue: export
# maintenance.*   → queue: cleanup

# Chain example:
chain(
    transcribe_audio.s(meeting_id, audio_path),
    diarize_audio.s(meeting_id, audio_path),
    process_transcript_nlp.s(meeting_id),
    generate_minutes.s(meeting_id, "government"),
    index_meeting_for_rag.s(meeting_id)
).apply_async()
```

## Configuration System

```python
# config.py - Pydantic Settings with env prefix
class Settings(BaseSettings):
    # All fields have defaults, overridden by RISALAH_* env vars
    whisper_model_size: Literal["tiny", "base", "small", "medium", "large", "large-v3"] = "large-v3"
    whisper_device: Literal["cpu", "cuda", "mps"] = "cpu"
    whisper_compute_type: Literal["float16", "int8", "float32"] = "float16"
    
    # Lazy-loaded model paths
    embedding_model: str = "BAAI/bge-m3"
    vector_db_path: str = "/data/vector_db"
    
    # Celery
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"
    
    # Auth
    api_key: str = ""  # empty = disabled
    
    model_config = {"env_prefix": "RISALAH_", "env_file": ".env", "extra": "ignore"}

settings = Settings()  # singleton
```

## Testing Strategy

```bash
# Unit tests (mock external services)
pytest tests/test_services.py -v           # GovKB, Context, NLP, Minutes, Export
pytest tests/test_persistence.py -v        # Repository CRUD
pytest tests/test_pipeline.py -v           # Pipeline orchestration mocks
pytest tests/test_celery_tasks.py -v       # Celery task logic (no broker)
pytest tests/test_services.py -v           # All service unit tests

# Integration tests (require Redis + DB)
pytest tests/test_client.py -v             # FastAPI TestClient endpoint tests

# Run all
pytest tests/ -v --tb=short

# Coverage
pytest tests/ --cov=app --cov-report=html
```

### Test Fixtures

```python
# conftest.py
@pytest.fixture
def mock_ml_services():
    # Mocks all heavy ML services (WhisperX, PyAnnote, spaCy, etc.)
    # Returns MagicMock objects for predictable testing

@pytest.fixture
def sample_audio():
    # Creates temporary WAV file for testing

@pytest.fixture
def db_session():
    # In-memory SQLite for repo tests
```

## Deployment Checklist

### Pre-deployment
- [ ] Set `RISALAH_API_KEY` in production
- [ ] Configure PostgreSQL (`RISALAH_DATABASE_URL`)
- [ ] Set `RISALAH_HUGGINGFACE_TOKEN` for PyAnnote
- [ ] Set `RISALAH_NINE_ROUTER_KEY` for LLM
- [ ] Mount persistent volumes: `/data/audio`, `/data/transcripts`, `/data/exports`, `/data/vector_db`
- [ ] Run Alembic migrations: `alembic upgrade head`

### Docker Compose Production
```yaml
services:
  ai-service:
    build: .
    environment:
      - RISALAH_API_KEY=${API_KEY}
      - RISALAH_DATABASE_URL=postgresql+asyncpg://...
      - RISALAH_HUGGINGFACE_TOKEN=${HF_TOKEN}
      - RISALAH_NINE_ROUTER_KEY=${NINE_ROUTER_KEY}
    volumes:
      - audio_data:/data/audio
      - transcript_data:/data/transcripts
      - export_data:/data/exports
      - vector_data:/data/vector_db
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  celery-worker:
    build: .
    command: celery -A app.celery_app worker --loglevel=info -Q transcription,diarization,nlp,minutes,rag,export,cleanup
    volumes:
      - audio_data:/data/audio
      - transcript_data:/data/transcripts
      - export_data:/data/exports
      - vector_data:/data/vector_db

  celery-beat:
    build: .
    command: celery -A app.celery_app beat --loglevel=info
```

### GPU Requirements
- NVIDIA GPU with 8GB+ VRAM (for large-v3 + PyAnnote)
- CUDA 11.8+ / cuDNN 8+
- `nvidia-container-toolkit` installed

### Monitoring
- Health: `GET /api/v1/health` → checks DB, Redis, model load status
- Logs: Structured JSON logging via `structlog`
- Metrics: Prometheus exporter on `/metrics` (add `prometheus-fastapi-instrumentator`)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WhisperX OOM | Use `int8` compute_type, reduce batch_size, use smaller model |
| PyAnnote auth failed | Set valid `HUGGINGFACE_TOKEN` with access to `pyannote/speaker-diarization-3.1` |
| spaCy model not found | Run `python -m spacy download id_core_news_sm` |
| Celery tasks stuck | Check Redis connection, worker logs, queue routing |
| ChromaDB permission error | Ensure `/data/vector_db` writable by container user |
| Slow transcription | Enable GPU, use `float16`, consider `medium` model for speed |

## Extending the System

### Add New NLP Feature
1. Add method to `IndonesianNLPService`
2. Add schema in `models/schemas.py`
3. Add endpoint in `routers/nlp.py`
4. Add tests in `tests/test_services.py`

### Add New Template
1. Add `.docx` template to `app/services/knowledge_base/templates/`
2. Register in `MinutesGeneratorService._load_templates()`
3. Add type to `MinutesRequest.template_type` enum

### Add New Queue
1. Add queue to `celery_config.py` task_routes
2. Start worker with `-Q new_queue`
3. Add task in `tasks/new_task.py`

---

*Technical Documentation v1.0.0 - Generated 2024-07-11*