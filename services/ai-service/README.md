# AI Service — Risalah SEKNEG

## Architecture

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

## API Endpoints

### Speech Recognition (Team 1)
- `POST /api/v1/transcription/transcribe` — Transcribe audio file
- `POST /api/v1/transcription/batch` — Queue batch transcription
- `POST /api/v1/transcription/stream` — WebSocket streaming (future)

### Speaker Diarization (Team 2)
- `POST /api/v1/diarization/diarize` — Detect & separate speakers
- `POST /api/v1/diarization/from-path` — Diarize from file path

### Indonesian NLP (Team 3)
- `POST /api/v1/nlp/normalize` — Text normalization (numbers, currency, dates, grammar)
- `POST /api/v1/nlp/correct` — Grammar correction
- `POST /api/v1/nlp/summarize` — Text summarization

### Government Intelligence (Team 4)
- `POST /api/v1/government/extract` — Extract government entities from text
- `GET /api/v1/government/knowledge-base` — Get KB by category
- `GET /api/v1/government/glossary` — Full glossary

### Context Understanding (Team 5)
- `POST /api/v1/context/extract` — Extract action items, decisions, votes
- `POST /api/v1/context/action-items` — Action items only
- `POST /api/v1/context/decisions` — Decisions only

### Minutes Generator (Team 6)
- `POST /api/v1/minutes/generate` — Generate notula from template
- `GET /api/v1/minutes/templates` — List all templates
- `GET /api/v1/minutes/templates/{type}` — Get specific template

### AI Chat / RAG (Team 7)
- `POST /api/v1/chat/ask` — Ask question with RAG
- `POST /api/v1/chat/index` — Index meeting transcript
- `DELETE /api/v1/chat/index/{meeting_id}` — Delete meeting index

## Running

### With Docker (CPU):
```bash
docker-compose up -d ai-service redis
```

### GPU Mode:
Uncomment `ai-service-gpu` in `docker-compose.yml` and ensure nvidia-docker is installed.

### Without Docker:
```bash
cd services/ai-service
pip install -r requirements.txt
python -m spacy download id_core_news_sm
uvicorn app.main:app --reload --port 8000
```

## Configuration

All config via environment variables with `RISALAH_` prefix:
- `RISALAH_WHISPER_MODEL_SIZE`: tiny/base/small/medium/large/large-v3 (default: large-v3)
- `RISALAH_WHISPER_DEVICE`: cpu/cuda/mps (default: cpu)
- `RISALAH_USE_GPU`: true/false (default: false)
- `RISALAH_EMBEDDING_MODEL`: HuggingFace model name (default: BAAI/bge-m3)
