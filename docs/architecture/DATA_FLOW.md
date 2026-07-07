# Data Flow Architecture

## 1. Audio Upload → Transcription Pipeline

```
User Uploads Audio
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Next.js API  │────▶│ Object Store │
│ /api/upload  │     │ (MinIO/S3)   │
└──────┬───────┘     └──────────────┘
       │
       │ Push to queue
       ▼
┌──────────────┐
│  Redis Queue │
│  (Celery)    │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│         AI Worker (GPU)             │
│                                     │
│  1. Audio Preprocessing             │
│     - Format conversion             │
│     - Noise reduction               │
│     - Sample rate normalization     │
│                                     │
│  2. Speech Recognition (Whisper)    │
│     - Batch transcription           │
│     - Word-level timestamps         │
│     - Confidence scores             │
│                                     │
│  3. Speaker Diarization (pyannote)  │
│     - Speaker segmentation          │
│     - Speaker embedding             │
│     - Speaker matching              │
│                                     │
│  4. Indonesian NLP                  │
│     - Text normalization            │
│     - Punctuation restoration       │
│     - Capitalization                │
│     - Number/currency/date convert  │
│                                     │
│  5. Context Understanding           │
│     - Action item detection         │
│     - Decision detection            │
│     - Key point extraction          │
│     - Entity recognition (gov't)    │
│                                     │
│  6. Summary Generation (LLM)        │
│     - Key points extraction         │
│     - Action items generation       │
│     - Decisions identification      │
│                                     │
│  7. Minutes Generation (LLM)        │
│     - Template-based formatting     │
│     - Government terminology        │
└─────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  + PGVector  │
└──────────────┘
       │
       ▼
┌──────────────┐
│  WebSocket   │──▶ Real-time update to frontend
│  Notification│
└──────────────┘
```

## 2. Live Meeting → Streaming Pipeline

```
Microphone / Device
       │
       ▼
┌──────────────────┐
│  WebSocket Stream│
│  (Audio Chunks)  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Audio Buffer    │
│  (Ring Buffer)   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Streaming ASR   │
│  (Whisper - live)│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Speaker Stream  │
│  (Real-time      │
│   diarization)   │
└──────┬───────────┘
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
┌──────────────┐              ┌──────────────────┐
│  Transcript  │              │  WebSocket Push   │
│  (DB store)  │─────────────▶│  to Frontend      │
└──────────────┘              │  (SSE/WS)         │
                              └──────────────────┘
```

## 3. AI Chat / RAG Flow

```
User Question
       │
       ▼
┌──────────────┐
│  /api/chat   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│  1. Query Understanding             │
│     - Classify intent               │
│     - Extract entities              │
│     - Detect scope (meeting/org)    │
│                                     │
│  2. Retrieval                       │
│     - Embed query (Cohere/BGE-M3)   │
│     - Vector search PGVector        │
│       - Transcript lines            │
│       - Summary content             │
│       - Minutes content             │
│     - Hybrid search (vector + BM25) │
│     - Rerank results                │
│                                     │
│  3. Context Assembly                │
│     - Chunk retrieved docs          │
│     - Build prompt with citations   │
│     - Add meeting context           │
│                                     │
│  4. Generation (LLM)               │
│     - Generate answer               │
│     - Cite sources                  │
│     - Stream via SSE                │
└─────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Frontend    │◀─── SSE Stream (token by token)
│  Display     │
│  + Citations │
└──────────────┘
```

## 4. Export Flow

```
User Requests Export
       │
       ▼
┌──────────────┐
│  /api/export │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│  Export Worker                 │
│                                │
│  1. Fetch meeting data         │
│  2. Apply template             │
│  3. Generate file              │
│     - PDF (Puppeteer/WeasyPrint)│
│     - DOCX (python-docx)       │
│     - TXT (plain)              │
│     - JSON (structured data)   │
│  4. Upload to object storage   │
│  5. Save export log            │
│  6. Notify user                │
└────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Notification│──▶ User downloads
└──────────────┘
```
