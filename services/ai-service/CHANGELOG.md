# Changelog — Risalah AI Service

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-07-11

### Added
- **Complete Transcription Pipeline**
  - WhisperX integration (faster-whisper backend) with batched inference
  - Word-level timestamp alignment via WhisperX alignment models
  - Automatic language detection (Indonesian primary)
  - GPU/CPU auto-detection with fallback (int8 on CPU, float16 on GPU)

- **Speaker Diarization**
  - PyAnnote Audio 3.1 pipeline integration
  - Speaker embedding extraction (SpeechBrain ECAPA-TDNN)
  - Configurable speaker count hint
  - Mock/fallback mode for CPU-only environments

- **Indonesian NLP Processing**
  - Text normalization: numbers → words, currency formatting, date parsing
  - Punctuation fixing and capitalization
  - Grammar correction (basic rules)
  - Extractive summarization (sentence scoring)
  - spaCy Indonesian model integration (id_core_news_sm)

- **Government Knowledge Base**
  - Entity extraction for government terms
  - Categories: lembaga_negara, struktur_pemerintahan, anggaran, jabatan, regulasi, wilayah
  - JSON-based knowledge base with flat→nested normalization
  - Glossary API endpoints for extraction, KB browsing, and glossary

- **Context Understanding**
  - Action item extraction (assignment patterns: "ditugaskan", "menugaskan", "diminta")
  - Decision detection (approval/rejection patterns)
  - Vote detection (setuju/tidak setuju/abstain)
  - Interruption detection (menyela/izin menyela)
  - Deadline extraction (date parsing with Indonesian months)
  - Participant-aware PIC assignment

- **Minutes Generator**
  - DOCX generation via python-docx + Jinja2 templates
  - 3 built-in templates: government (Pemerintah), DPRD, BUMN
  - Indonesian government format compliance:
    - Kop Surat Negara
    - Header rapat (tempat, tanggal, waktu, agenda)
    - Daftar hadir dengan jabatan
    - Ringkasan isi rapat
    - Tabel Tindak Lanjut (action items with PIC, deadline, prioritas)
    - Tabel Keputusan
    - Area tanda tangan

- **RAG Engine (Chat with Meetings)**
  - ChromaDB vector store with BGE-M3 embeddings
  - Meeting indexing: transcript + minutes + action items → chunks
  - Semantic search with metadata filtering (meeting_id)
  - LLM integration via 9router proxy (Groq, Gemini, Cerebras)
  - Citation support with source text and relevance scores

- **Async Pipeline Orchestration (Celery + Redis)**
  - 8-step pipeline: preprocess → transcribe → diarize → merge → NLP → minutes → RAG index → cleanup
  - Pipeline state tracking in database (pending/completed/failed)
  - Automatic retry with exponential backoff
  - Queue routing: transcription, diarization, nlp, minutes, rag, export, cleanup
  - Periodic cleanup tasks (temp files, old results)

- **Database Layer**
  - Async SQLAlchemy 2.0 with SQLite (dev) / PostgreSQL (prod)
  - Alembic migrations with autogenerate
  - 5 tables: meetings, transcript_lines, action_items, decisions, minutes
  - Cascading deletes, proper indexes, JSONB for flexible data

- **API Layer (FastAPI)**
  - 33 REST endpoints across 12 routers
  - Pydantic v2 request/response validation
  - API Key authentication middleware (X-API-Key header)
  - Excluded paths: /, /health, /docs, /openapi.json
  - Comprehensive error handling with proper status codes
  - File upload with 500MB limit
  - CORS configurable via env

- **Authentication & Security**
  - API Key middleware (configurable via RISALAH_API_KEY)
  - Optional disable (empty key = no auth)
  - Secure defaults: no auth bypass in production

- **Testing Suite (65 tests passing)**
  - Unit tests: GovKB, ContextExtractor, IndonesianNLP, MinutesGenerator, ExportService
  - Integration tests: Pipeline orchestration, Database persistence, Celery tasks
  - Auth middleware tests (7 tests)
  - Celery task unit tests (19 tests) with mocking
  - Pytest fixtures for ML service mocking
  - TestClient for endpoint testing

- **Logging & Observability**
  - Structured logging throughout (no print statements)
  - Module-level loggers with proper levels
  - Error logging with context

- **Documentation**
  - Comprehensive README.md
  - API_DOCS.md (full endpoint reference)
  - API_QUICK_REF.md (quick reference card)
  - DEPLOYMENT.md (production deployment guide)
  - CHANGELOG.md

### Changed
- Replaced all `print()` statements with proper `logging` calls
- Migrated from sync to async database operations
- Unified error handling patterns across services

### Fixed
- Government KB JSON normalization (flat→nested with category mapping)
- Context extractor regex patterns for Indonesian assignments/interruptions
- NLP number normalization assertions (num2words optional dependency)
- Celery task signature handling in tests
- Audio preprocessing indentation/syntax issues
- WhisperX alignment error handling (graceful fallback)

---

## [0.9.0] - 2024-07-08 (Pre-release)

### Added
- Initial project structure
- Basic FastAPI app with health check
- WhisperX transcription service
- PyAnnote diarization service
- Government KB with flat JSON
- Context extractor (basic patterns)
- Minutes generator (single template)
- SQLite database with basic models
- Celery app configuration

---

## Upcoming (Planned)

### [1.1.0] - Q3 2024
- [ ] WebSocket streaming transcription
- [ ] Multi-language support (English, Javanese, Sundanese)
- [ ] Advanced grammar correction (Indonesian BERT)
- [ ] Custom template editor (web UI)
- [ ] Batch processing UI
- [ ] Prometheus metrics endpoint
- [ ] OpenTelemetry tracing

### [1.2.0] - Q4 2024
- [ ] Real-time collaboration on minutes
- [ ] Version control for minutes
- [ ] Advanced RAG: hybrid search (BM25 + vector)
- [ ] Speaker identification (enrollment/verification)
- [ ] Audio enhancement (deep learning denoising)
- [ ] Kubernetes Helm charts

---

## Migration Notes

### v0.9.0 → v1.0.0
- Database schema changed: run `alembic upgrade head`
- API key now required (set RISALAH_API_KEY or disable with empty string)
- Celery task signatures updated (use `.s()` for signatures)
- Government KB JSON format changed (flat with "type" field)
- Environment variables prefixed with RISALAH_

---

## Contributors
- Backend Team
- ML Engineering Team
- DevOps Team
- QA Team

---

*Generated: 2024-07-11*