# AI Service — Risalah SEKNEG

## 📋 Overview

AI Service adalah layanan AI modular untuk aplikasi **Risalah** (Sistem Notula Rapat Otomatis) yang dikembangkan untuk Sekretariat Negara (SEKNEG). Service ini menyediakan pipeline end-to-end dari audio hingga notula rapat resmi dalam format DOCX dengan format standar pemerintah Indonesia.

**Versi:** 1.0.0  
**Port Default:** 8000  
**Base URL:** `http://localhost:8000/api/v1`

---

## 🏗️ Arsitektur Sistem

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Next.js App  │────▶│   AI Gateway      │────▶│  Whisper (STT)    │
│  (Frontend)   │     │   Port 8000       │     │  (CPU/GPU)        │
└──────────────┘     └──────────────────┘     └───────────────────┘
                            │                           │
                            │                           │
                     ┌──────┴──────┐           ┌───────┴───────┐
                     │   Redis     │           │  PyAnnote      │
                     │   (Queue)   │           │  (Diarization) │
                     └─────────────┘           └───────────────┘
                                                     │
                            ┌─────────────────────────┘
                            │
                     ┌──────┴──────────────────┐
                     │  AI Pipeline Services   │
                     │  ┌────────────────────┐ │
                     │  │ Indonesian NLP     │ │
                     │  │ Government KB      │ │
                     │  │ Context Extractor  │ │
                     │  │ Minutes Generator  │ │
                     │  │ RAG Engine (Chat)  │ │
                     │  └────────────────────┘ │
                     └─────────────────────────┘
```

### Komponen Utama

| Komponen | Teknologi | Deskripsi |
|----------|-----------|-----------|
| **STT Engine** | Faster-Whisper / WhisperX | Speech-to-Text dengan word-level timestamps |
| **Diarization** | PyAnnote Audio 3.1 | Speaker diarization + embedding |
| **Indonesian NLP** | spaCy (id_core_news_sm) + custom rules | Normalisasi, grammar correction, summarization |
| **Government KB** | JSON-based knowledge base | Entitas pemerintah, instansi, regulasi, jabatan |
| **Context Extractor** | Regex + NLP patterns | Action items, decisions, votes, interruptions |
| **Minutes Generator** | python-docx + Jinja2 templates | Notula resmi format pemerintah (Pemerintah/DPRD/BUMN) |
| **RAG Engine** | ChromaDB + BGE-M3 + 9router LLM | Chat dengan konteks meeting |
| **Queue System** | Celery + Redis | Asynchronous pipeline processing |

---

## 🚀 Quick Start

### Prasyarat
- Python 3.10+
- Redis 7+
- (Optional) NVIDIA GPU + CUDA 11.8+ untuk GPU mode
- (Optional) spaCy Indonesian model: `python -m spacy download id_core_news_sm`

### 1. Install Dependencies
```bash
cd services/ai-service
pip install -r requirements.txt
```

### 2. Download spaCy Model (untuk Indonesian NLP)
```bash
python -m spacy download id_core_news_sm
```

### 3. Setup Environment
```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 4. Jalankan Service
```bash
# Development mode dengan hot reload
uvicorn app.main:app --reload --port 8000

# Atau production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. Jalankan Celery Workers (untuk pipeline async)
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Celery worker untuk semua queue
celery -A app.celery_app worker --loglevel=info -Q transcription,diarization,nlp,minutes,rag,export,cleanup,default

# Terminal 3: Celery beat (untuk periodic tasks)
celery -A app.celery_app beat --loglevel=info
```

---

## 🐳 Docker Deployment

### CPU Only (Development)
```bash
docker-compose up -d ai-service redis
```

### GPU Mode (Production)
```bash
# Uncomment ai-service-gpu di docker-compose.yml
docker-compose up -d ai-service-gpu redis
```

### Docker Compose Services
| Service | Port | Description |
|---------|------|-------------|
| `ai-service` | 8000 | Main API (CPU) |
| `ai-service-gpu` | 8001 | Main API (GPU) |
| `redis` | 6379 | Message broker & result backend |
| `celery-worker` | - | Background task processor |
| `celery-beat` | - | Periodic task scheduler |

---

## ⚙️ Konfigurasi Environment Variables

Semua konfigurasi menggunakan prefix `RISALAH_`. File `.env` di root project.

### Core Settings
```env
# Application
RISALAH_APP_NAME="Risalah AI Service"
RISALAH_APP_VERSION="1.0.0"
RISALAH_DEBUG=false

# Model Paths
RISALAH_WHISPER_MODEL_SIZE=large-v3          # tiny/base/small/medium/large/large-v3
RISALAH_WHISPER_DEVICE=cpu                    # cpu/cuda/mps
RISALAH_WHISPER_COMPUTE_TYPE=float16          # float16/int8/float32

# WhisperX Alignment
RISALAH_WHISPERX_ALIGN_MODEL=WAV2VEC2_ASR_BASE_INDONESIAN
RISALAH_WHISPERX_LANGUAGE=id

# Diarization
RISALAH_DIARIZATION_MODEL=pyannote/speaker-diarization-3.1
RISALAH_DIARIZATION_DEVICE=cpu
RISALAH_HUGGINGFACE_TOKEN=your_hf_token        # Required for PyAnnote

# VAD
RISALAH_VAD_THRESHOLD=0.5
RISALAH_VAD_MIN_SPEECH_DURATION_MS=250
RISALAH_VAD_MIN_SILENCE_DURATION_MS=100

# Noise Reduction
RISALAH_NOISE_REDUCTION_ENABLED=true
RISALAH_NOISE_REDUCTION_METHOD=noisereduce     # rnnoise/noisereduce

# Embeddings
RISALAH_EMBEDDING_MODEL=BAAI/bge-m3
RISALAH_EMBEDDING_DEVICE=cpu

# Vector DB
RISALAH_VECTOR_DB_PATH=/data/vector_db

# Celery / Queue
RISALAH_CELERY_BROKER_URL=redis://redis:6379/0
RISALAH_CELERY_RESULT_BACKEND=redis://redis:6379/1

# Storage Paths
RISALAH_AUDIO_STORAGE_PATH=/data/audio
RISALAH_TRANSCRIPT_STORAGE_PATH=/data/transcripts
RISALAH_EXPORT_STORAGE_PATH=/data/exports

# Database
RISALAH_DATABASE_URL=sqlite+aiosqlite:///./risalah.db
# Production: postgresql+asyncpg://user:pass@host:5432/risalah

# API
RISALAH_API_HOST=0.0.0.0
RISALAH_API_PORT=8000
RISALAH_MAX_UPLOAD_SIZE=524288000              # 500MB
RISALAH_CORS_ORIGINS=["*"]

# GPU
RISALAH_USE_GPU=false
RISALAH_GPU_MEMORY_LIMIT=8                     # GB

# 9router LLM Proxy
RISALAH_NINE_ROUTER_BASE=http://localhost:20128/v1
RISALAH_NINE_ROUTER_MODEL=free-developer
RISALAH_NINE_ROUTER_KEY=

# Skills
RISALAH_SKILLS_ENABLED=true
RISALAH_SKILLS_PATH=/app/app/skills

# Government Dictionary
RISALAH_GOV_DICT_PATH=/app/app/skills/gov_dictionary/data

# Context Engine
RISALAH_CONTEXT_ENGINE_MODEL=kr/claude-sonnet-4.5

# Minutes Generator
RISALAH_MINUTES_TEMPLATES_PATH=/app/app/services/knowledge_base/templates

# API Key Auth (optional - if empty, auth disabled)
RISALAH_API_KEY=your-secure-api-key-here
```

---

## 📚 API Endpoints Reference

### Authentication
Semua endpoint (kecuali `/health`, `/docs`, `/openapi.json`) memerlukan header:
```
X-API-Key: your-secure-api-key-here
```

### Base URL
```
http://localhost:8000/api/v1
```

---

### 🎤 Speech Recognition (Transcription)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transcription/transcribe` | Transcribe single audio file |
| POST | `/transcription/batch` | Queue batch transcription |
| GET | `/transcription/status/{task_id}` | Check transcription status |
| GET | `/transcription/result/{task_id}` | Get transcription result |

**Request (transcribe):**
```bash
curl -X POST "http://localhost:8000/api/v1/transcription/transcribe" \
  -H "X-API-Key: your-key" \
  -F "file=@meeting.wav" \
  -F "language=id" \
  -F "diarize=true" \
  -F "generate_minutes=true"
```

**Response:**
```json
{
  "task_id": "abc123",
  "status": "queued",
  "message": "Transcription queued for processing"
}
```

---

### 🎙️ Speaker Diarization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/diarization/diarize` | Diarize audio file |
| POST | `/diarization/from-path` | Diarize from file path |
| GET | `/diarization/status/{task_id}` | Check status |

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/diarization/diarize" \
  -H "X-API-Key: your-key" \
  -F "file=@meeting.wav" \
  -F "num_speakers=3"
```

---

### 🇮🇩 Indonesian NLP

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nlp/normalize` | Text normalization (angka, uang, tanggal, grammar) |
| POST | `/nlp/correct` | Grammar correction |
| POST | `/nlp/summarize` | Text summarization (extractive) |

**Request (normalize):**
```bash
curl -X POST "http://localhost:8000/api/v1/nlp/normalize" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Rapat dimulai pukul 09.00 WIB dengan 12 peserta dari 5 OPD",
    "fix_punctuation": true,
    "normalize_numbers": true,
    "normalize_currency": true,
    "normalize_dates": true,
    "capitalize": true
  }'
```

**Response:**
```json
{
  "normalized": "Rapat dimulai pukul 09.00 WIB dengan dua belas peserta dari lima OPD.",
  "changes": [
    {"original": "12", "normalized": "dua belas", "type": "number"},
    {"original": "5", "normalized": "lima", "type": "number"}
  ]
}
```

---

### 🏛️ Government Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/government/extract` | Extract entitas pemerintah dari teks |
| GET | `/government/knowledge-base` | Get KB by category |
| GET | `/government/glossary` | Full glossary |

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/government/extract" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"text": "Gubernur DKI Jakarta hadir di rapat APBD DPRD bersama Bupati dan Walikota"}'
```

**Response:**
```json
{
  "entities": [
    {"text": "Gubernur", "normalized": "Gubernur", "category": "jabatan", "confidence": 0.98},
    {"text": "DKI Jakarta", "normalized": "DKI Jakarta", "category": "wilayah", "confidence": 0.95},
    {"text": "APBD", "normalized": "APBD", "category": "anggaran", "confidence": 0.97},
    {"text": "DPRD", "normalized": "DPRD", "category": "lembaga_negara", "confidence": 0.98},
    {"text": "Bupati", "normalized": "Bupati", "category": "jabatan", "confidence": 0.98},
    {"text": "Walikota", "normalized": "Walikota", "category": "jabatan", "confidence": 0.98}
  ]
}
```

**Categories Available:** `lembaga_negara`, `struktur_pemerintahan`, `anggaran`, `jabatan`, `regulasi`, `wilayah`

---

### 🧠 Context Understanding

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/context/extract` | Extract action items, decisions, votes, interruptions, deadlines |
| POST | `/context/action-items` | Action items only |
| POST | `/context/decisions` | Decisions only |

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/context/extract" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bapak Andi ditugaskan untuk menyusun laporan hingga Jumat. Saya setuju dengan proposal ini. Ibu Siti menyela untuk menambahkan informasi budget.",
    "participants": ["Bapak Andi", "Ibu Siti"]
  }'
```

**Response:**
```json
{
  "action_items": [
    {"description": "Bapak Andi ditugaskan untuk menyusun laporan", "pic": "Bapak Andi", "deadline": "Jumat", "priority": "high"}
  ],
  "decisions": [
    {"description": "Setuju dengan proposal ini", "category": "approval"}
  ],
  "votes": [],
  "interruptions": [
    {"text": "Ibu Siti menyela untuk menambahkan informasi budget", "speaker": "Ibu Siti"}
  ],
  "deadlines": [
    {"text": "Jumat", "date": "2024-01-12"}
  ]
}
```

---

### 📄 Minutes Generator (Notula)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/minutes/generate` | Generate notula dari template |
| GET | `/minutes/templates` | List all templates |
| GET | `/minutes/templates/{type}` | Get specific template |

**Templates Available:**
- `government` — Notula Rapat Pemerintah (format standar)
- `dprd` — Notula Rapat DPRD
- `bumn` — Notula Rapat BUMN
- `custom` — Custom template

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/minutes/generate" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": "meeting-123",
    "template_type": "government",
    "title": "Rapat Koordinasi Evaluasi Program",
    "date": "2024-01-15",
    "location": "Ruang Rapat Lt. 3",
    "participants": ["Dr. Budi Santoso", "Ir. Siti Rahayu"],
    "transcript": [...],
    "action_items": [...],
    "decisions": [...]
  }'
```

**Response:** File DOCX (binary) dengan format:
- Kop Surat Negara
- Header Rapat
- Daftar Hadir
- Isi Rapat (Ringkasan)
- Tabel Tindak Lanjut (Action Items)
- Tabel Keputusan
- Tanda Tangan

---

### 💬 AI Chat / RAG

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/ask` | Tanya jawab dengan RAG |
| POST | `/chat/index` | Index meeting untuk RAG |
| DELETE | `/chat/index/{meeting_id}` | Hapus index meeting |

**Request (ask):**
```bash
curl -X POST "http://localhost:8000/api/v1/chat/ask" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Apa keputusan rapat tentang anggaran?",
    "meeting_ids": ["meeting-123"],
    "model": "free-developer"
  }'
```

**Response:**
```json
{
  "answer": "Rapat menyetujui anggaran sebesar Rp 500 juta untuk program evaluasi...",
  "citations": [
    {"meeting_id": "meeting-123", "text": "...anggaran sebesar 500 juta...", "score": 0.92}
  ],
  "model_used": "free-developer"
}
```

---

### 📊 Meetings CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meetings` | List all meetings (paginated) |
| GET | `/meetings/{meeting_id}` | Get meeting detail |
| DELETE | `/meetings/{meeting_id}` | Delete meeting |
| PATCH | `/meetings/{meeting_id}/status` | Update meeting status |

---

### 📤 Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meetings/{meeting_id}/export` | Download notula DOCX |

```bash
curl -X GET "http://localhost:8000/api/v1/meetings/meeting-123/export" \
  -H "X-API-Key: your-key" \
  --output notula.docx
```

---

### ❤️ Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check (no auth required) |

```bash
curl http://localhost:8000/api/v1/health
# Response: {"status": "healthy", "version": "1.0.0", "services": {...}}
```

---

## 🔧 Pipeline Orchestration

### Full Pipeline (Async via Celery)
```
transcribe_audio → diarize_audio → merge_transcription_diarization 
  → process_transcript_nlp → generate_minutes → index_meeting_for_rag
```

### Manual Trigger
```python
from app.tasks.transcription import create_transcription_pipeline

# Full pipeline
pipeline = create_transcription_pipeline("meeting-123", "/data/audio/meeting-123.wav")
pipeline.apply_async()
```

### Status Tracking
Pipeline state disimpan di database dengan `PipelineState` enum:
- `pending` → `transcribing` → `diarizing` → `merging` → `nlp_processing` → `generating_minutes` → `indexing_rag` → `completed`
- Atau `failed` di step manapun dengan error message

---

## 🗄️ Database Schema

### Tables
| Table | Description |
|-------|-------------|
| `meetings` | Metadata rapat (id, title, date, location, status, audio_path) |
| `transcript_lines` | Baris transkrip dengan speaker, timestamp, confidence |
| `action_items` | Tindak lanjut (description, pic, deadline, priority, status) |
| `decisions` | Keputusan rapat (description, category) |
| `minutes` | Konten notula yang di-generate (template_type, content) |

### Migration (Alembic)
```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 🧪 Testing

### Run All Tests
```bash
cd services/ai-service
python -m pytest tests/ -v --tb=short
```

### Test Coverage
```bash
python -m pytest tests/ --cov=app --cov-report=html
```

### Test Files
| File | Description |
|------|-------------|
| `tests/test_auth.py` | API key auth middleware tests (7 tests) |
| `tests/test_celery_tasks.py` | Celery task unit tests (19 tests) |
| `tests/test_services.py` | Core services tests (20 tests) |
| `tests/test_pipeline.py` | Pipeline integration tests (5 tests) |
| `tests/test_persistence.py` | Database persistence tests (6 tests) |
| `tests/test_minutes_export.py` | Minutes + export tests (8 tests) |

**Total: 65 tests passing**

---

## 📦 Requirements

### Core Dependencies
```
# FastAPI & ASGI
fastapi==0.109.0
uvicorn[standard]==0.27.0

# Database
sqlalchemy[asyncio]==2.0.25
alembic==1.13.1
aiosqlite==0.19.0
asyncpg==0.29.0

# AI/ML
faster-whisper==1.0.3
whisperx==3.1.1
pyannote.audio==3.1.1
torch==2.2.0
torchaudio==2.2.0

# NLP
spacy==3.7.4
num2words==0.5.13

# Document Processing
python-docx==1.1.0
jinja2==3.1.3

# Vector DB & RAG
chromadb==0.4.24
langchain==0.1.14
langchain-chroma==0.1.0
langchain-huggingface==0.0.5
sentence-transformers==2.2.2

# Queue
celery==5.3.6
redis==5.0.1

# Utilities
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
httpx==0.26.0
```

### Optional (GPU)
```
# Uncomment untuk GPU support
# torch==2.2.0+cu121
# torchaudio==2.2.0+cu121
```

---

## 🔐 Security

### API Key Authentication
- Middleware memvalidasi `X-API-Key` header
- Bisa disable dengan set `RISALAH_API_KEY=""` (empty)
- Path yang di-exclude: `/`, `/api/v1/health`, `/docs`, `/openapi.json`, `/redoc`

### Rate Limiting (Recommended)
```python
# Tambahkan ke main.py jika diperlukan
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/v1/transcription/transcribe")
@limiter.limit("10/minute")
async def transcribe(...):
```

---

## 🐛 Troubleshooting

### Model Not Loading
```bash
# Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"

# Check HF token untuk PyAnnote
export HUGGINGFACE_TOKEN=your_token
```

### Memory Issues
```bash
# Reduce whisper model size
RISALAH_WHISPER_MODEL_SIZE=medium

# Limit batch size
RISALAH_WHISPER_BATCH_SIZE=4
```

### Celery Tasks Not Running
```bash
# Check Redis connection
redis-cli ping

# Check worker logs
celery -A app.celery_app worker --loglevel=debug
```

### spaCy Model Missing
```bash
python -m spacy download id_core_news_sm
# Atau gunakan model blank jika tidak tersedia
```

---

## 📁 Project Structure

```
services/ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Pydantic settings
│   ├── celery_app.py              # Celery configuration
│   ├── database.py                # SQLAlchemy async engine
│   ├── models/
│   │   ├── __init__.py
│   │   ├── db_models.py           # SQLAlchemy ORM models
│   │   └── schemas.py             # Pydantic request/response models
│   ├── repositories/
│   │   └── meeting_repo.py        # Database operations
│   ├── services/
│   │   ├── __init__.py
│   │   ├── whisperx_stt.py        # WhisperX transcription
│   │   ├── whisper_stt.py         # Faster-Whisper fallback
│   │   ├── silero_vad.py          # Voice Activity Detection
│   │   ├── noise_reduction.py     # Noise reduction
│   │   ├── audio_preprocessing.py # VAD + NR facade
│   │   ├── diarization.py         # PyAnnote diarization
│   │   ├── indonesian_nlp.py      # Indonesian NLP processing
│   │   ├── government_kb.py       # Government knowledge base
│   │   ├── context_extractor.py   # Context understanding
│   │   ├── minutes_generator.py   # DOCX generation
│   │   ├── rag_engine.py          # RAG + Chat
│   │   ├── export_service.py      # DOCX export
│   │   ├── audio_storage.py       # File storage
│   │   ├── pipeline_orchestrator.py # Pipeline coordination
│   │   └── llm_client.py          # 9router LLM client
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── transcription.py       # Transcription tasks
│   │   ├── diarization.py         # Diarization tasks
│   │   ├── nlp.py                 # NLP tasks
│   │   ├── minutes.py             # Minutes tasks
│   │   ├── rag.py                 # RAG tasks
│   │   ├── export.py              # Export tasks
│   │   └── maintenance.py         # Cleanup tasks
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── transcription.py
│   │   ├── diarization.py
│   │   ├── nlp.py
│   │   ├── government.py
│   │   ├── context.py
│   │   ├── minutes.py
│   │   ├── chat.py
│   │   ├── models.py
│   │   ├── pipeline.py
│   │   ├── meetings.py
│   │   └── export.py
│   ├── skills/
│   │   └── gov_dictionary/        # Government dictionary skill
│   └── knowledge_base/
│       ├── government_terms.json
│       ├── institutions.json
│       ├── indonesia_regions.json
│       └── templates/             # DOCX templates
├── tests/
│   ├── conftest.py                # Pytest fixtures
│   ├── test_auth.py
│   ├── test_celery_tasks.py
│   ├── test_services.py
│   ├── test_pipeline.py
│   ├── test_persistence.py
│   └── test_minutes_export.py
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── requirements.txt
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 📈 Monitoring & Logging

### Log Format
```python
# Structured logging dengan structlog (optional upgrade)
import structlog
logger = structlog.get_logger()
logger.info("transcription_started", meeting_id="123", duration_ms=5000)
```

### Key Metrics to Monitor
- Transcription latency (target: < 2x audio duration)
- Diarization accuracy (target: DER < 15%)
- Queue depth (Redis)
- Worker CPU/Memory usage
- Error rates per endpoint

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: AI Service Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.10'}
      - run: pip install -r requirements.txt
      - run: python -m spacy download id_core_news_sm
      - run: python -m pytest tests/ -v
```

---

## 📝 Changelog

### v1.0.0 (2024-07-11)
- ✅ Complete transcription pipeline (WhisperX + PyAnnote)
- ✅ Indonesian NLP (normalization, grammar, summarization)
- ✅ Government Knowledge Base (entities, glossary)
- ✅ Context Understanding (action items, decisions, votes)
- ✅ Minutes Generator (DOCX, 3 templates)
- ✅ RAG Engine (ChromaDB + BGE-M3 + 9router)
- ✅ Async Pipeline (Celery + Redis)
- ✅ API Key Authentication
- ✅ PostgreSQL/SQLite support (Alembic migrations)
- ✅ 65 unit/integration tests passing
- ✅ Full logging (no print statements)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/nama-fitur`
3. Write tests untuk fitur baru
3. Run tests: `pytest tests/ -v`
4. Commit: `git commit -m "feat: deskripsi singkat"`
5. Push & create PR

### Code Style
- Type hints mandatory untuk public functions
- Docstrings untuk semua classes & public methods
- Logger (not print) untuk debugging
- Follow existing patterns di codebase

---

## 📄 License

Proprietary - Risalah SEKNEG Project. All rights reserved.

---

## 📞 Support

- **Technical Issues:** Internal team chat
- **Model Questions:** ML team
- **Infrastructure:** DevOps team
- **Documentation:** Update README ini saat ada perubahan signifikan

---

*Last Updated: 2024-07-11*  
*Version: 1.0.0*