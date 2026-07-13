# API Documentation — Risalah AI Service

## Overview

RESTful API untuk layanan AI Risalah (Sistem Notula Rapat Otomatis). Base URL: `http://localhost:8000/api/v1`

---

## Authentication

Semua endpoint (kecuali health check & docs) memerlukan header:
```
X-API-Key: your-secure-api-key
```

**Disable auth:** Set `RISALAH_API_KEY=""` di environment.

**Excluded paths:** `/`, `/api/v1/health`, `/docs`, `/openapi.json`, `/redoc`

---

## Error Responses

```json
{
  "detail": "Error message"
}
```

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid API key) |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |
| 503 | Service Unavailable (model loading) |

---

## Health Check

### GET `/health`

No auth required.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "whisperx": "loaded",
    "diarization": "loaded",
    "nlp": "ready",
    "rag": "ready",
    "database": "connected"
  }
}
```

---

## Transcription

### POST `/transcription/transcribe`

Transcribe single audio file dengan opsi diarization & minutes generation.

**Request (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Audio file (WAV, MP3, M4A, etc.) |
| language | string | No | Language code (default: `id`) |
| diarize | boolean | No | Enable speaker diarization (default: true) |
| generate_minutes | boolean | No | Auto-generate minutes after (default: false) |
| template_type | string | No | Minutes template: `government`/`dprd`/`bumn`/`custom` |

**Response:**
```json
{
  "task_id": "abc123",
  "status": "queued",
  "message": "Transcription queued for processing"
}
```

---

### POST `/transcription/batch`

Queue batch transcription.

**Request (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| files | file[] | Yes | Multiple audio files |
| language | string | No | Language code |

**Response:**
```json
{
  "batch_id": "batch-456",
  "status": "queued",
  "files_count": 3
}
```

---

### GET `/transcription/status/{task_id}`

Check transcription status.

**Response:**
```json
{
  "task_id": "abc123",
  "status": "completed",  // pending/processing/completed/failed
  "progress": 100,
  "result": {
    "meeting_id": "meeting-123",
    "duration_ms": 1800000,
    "lines": [...]
  }  // only if completed
}
```

---

## Diarization

### POST `/diarization/diarize`

Speaker diarization dari audio file.

**Request (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Audio file |
| num_speakers | integer | No | Expected number of speakers (optional) |

**Response:**
```json
{
  "task_id": "diario-789",
  "status": "queued"
}
```

---

### GET `/diarization/status/{task_id}`

Check diarization status.

---

## Indonesian NLP

### POST `/nlp/normalize`

Normalisasi teks Indonesia (angka, uang, tanggal, tanda baca, kapitalisasi).

**Request:**
```json
{
  "text": "Rapat 12 orang pukul 09.00, budget 5.000.000",
  "fix_punctuation": true,
  "normalize_numbers": true,
  "normalize_currency": true,
  "normalize_dates": true,
  "capitalize": true
}
```

**Response:**
```json
{
  "normalized": "Rapat dua belas orang pukul 09.00, budget lima juta rupiah.",
  "changes": [
    {"original": "12", "normalized": "dua belas", "type": "number"},
    {"original": "5.000.000", "normalized": "lima juta rupiah", "type": "currency"}
  ]
}
```

---

### POST `/nlp/correct`

Grammar correction untuk Bahasa Indonesia.

**Request:**
```json
{"text": "Saya sudah makan nasi tadi pagi"}
```

**Response:**
```json
{
  "corrected": "Saya sudah makan nasi tadi pagi.",
  "changes": []
}
```

---

### POST `/nlp/summarize`

Ringkasan teks (extractive).

**Request:**
```json
{
  "text": "Teks panjang...",
  "max_sentences": 3,
  "language": "id"
}
```

---

## Government Intelligence

### POST `/government/extract`

Extract entitas pemerintah dari teks.

**Request:**
```json
{"text": "Gubernur DKI Jakarta hadir di rapat APBD DPRD bersama Bupati dan Walikota"}
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

**Categories:** `lembaga_negara`, `struktur_pemerintahan`, `anggaran`, `jabatan`, `regulasi`, `wilayah`

---

### GET `/government/knowledge-base`

Get knowledge base by category.

**Query Params:** `category` (optional)

**Response:**
```json
{
  "terms": {
    "lembaga_negara": {"DPRD": {"full": "Dewan Perwakilan Rakyat Daerah", "type": "lembaga_negara", ...}},
    "anggaran": {"APBD": {"full": "Anggaran Pendapatan dan Belanja Daerah", ...}}
  },
  "institutions": [...],
  "regions": [...]
}
```

---

### GET `/government/glossary`

Full glossary sebagai list.

**Response:**
```json
[
  {"term": "DPRD", "definition": "Dewan Perwakilan Rakyat Daerah", "category": "lembaga_negara"},
  {"term": "APBD", "definition": "Anggaran Pendapatan dan Belanja Daerah", "category": "anggaran"}
]
```

---

## Context Understanding

### POST `/context/extract`

Extract konteks lengkap dari transkrip rapat.

**Request:**
```json
{
  "text": "Bapak Andi ditugaskan untuk menyusun laporan hingga Jumat. Saya setuju dengan proposal ini. Ibu Siti menyela untuk menambahkan informasi budget.",
  "participants": ["Bapak Andi", "Ibu Siti"]
}
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

### POST `/context/action-items`

Action items only.

### POST `/context/decisions`

Decisions only.

---

## Minutes Generator

### POST `/minutes/generate`

Generate notula DOCX dari template.

**Request:**
```json
{
  "meeting_id": "meeting-123",
  "template_type": "government",
  "title": "Rapat Koordinasi Evaluasi Program",
  "date": "2024-01-15",
  "location": "Ruang Rapat Lt. 3",
  "participants": ["Dr. Budi Santoso", "Ir. Siti Rahayu"],
  "transcript": [...],
  "action_items": [...],
  "decisions": [...]
}
```

**Templates:** `government` | `dprd` | `bumn` | `custom`

**Response:** Binary DOCX file (download)

---

### GET `/minutes/templates`

List semua template tersedia.

**Response:**
```json
{
  "templates": [
    {"type": "government", "name": "Notula Rapat Pemerintah", "description": "Format standar pemerintah"},
    {"type": "dprd", "name": "Notula Rapat DPRD", "description": "Format DPRD dengan daftar hadir komisi"},
    {"type": "bumn", "name": "Notula Rapat BUMN", "description": "Format BUMN dengan agendaDireksi"},
    {"type": "custom", "name": "Custom Template", "description": "Template kustom user"}
  ]
}
```

---

### GET `/minutes/templates/{type}`

Get template detail.

---

## AI Chat / RAG

### POST `/chat/ask`

Tanya jawab dengan RAG (Retrieval-Augmented Generation).

**Request:**
```json
{
  "message": "Apa keputusan rapat tentang anggaran?",
  "meeting_ids": ["meeting-123"],
  "model": "free-developer",
  "top_k": 5
}
```

**Response:**
```json
{
  "answer": "Rapat menyetujui anggaran sebesar Rp 500 juta...",
  "citations": [
    {"meeting_id": "meeting-123", "text": "...anggaran sebesar 500 juta...", "score": 0.92}
  ],
  "model_used": "free-developer"
}
```

---

### POST `/chat/index`

Index meeting transcript untuk RAG.

**Request:**
```json
{"meeting_id": "meeting-123"}
```

**Response:**
```json
{"status": "completed", "chunks_indexed": 42}
```

---

### DELETE `/chat/index/{meeting_id}`

Hapus meeting dari RAG index.

---

## Meetings CRUD

### GET `/meetings`

List meetings (paginated).

**Query Params:**
- `page` (default: 1)
- `size` (default: 20, max: 100)
- `status` (optional filter)

**Response:**
```json
{
  "items": [
    {
      "id": "meeting-123",
      "title": "Rapat Koordinasi",
      "date": "2024-01-15",
      "location": "Ruang Rapat",
      "status": "completed",
      "duration_ms": 1800000,
      "created_at": "2024-01-15T09:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

---

### GET `/meetings/{meeting_id}`

Get meeting detail dengan transcript, action items, decisions, minutes.

---

### DELETE `/meetings/{meeting_id}`

Delete meeting (cascade deletes transcript, action items, decisions, minutes).

---

### PATCH `/meetings/{meeting_id}/status`

Update status.

**Request:**
```json
{"status": "completed"}  // pending/processing/completed/failed
```

---

## Export

### GET `/meetings/{meeting_id}/export`

Download notula DOCX.

**Response:** Binary DOCX (Content-Disposition: attachment)

---

## Pipeline (Async)

### POST `/pipeline/run`

Trigger full pipeline untuk audio file.

**Request:**
```json
{
  "audio_path": "/data/audio/meeting-123.wav",
  "meeting_id": "meeting-123",
  "language": "id",
  "diarize": true,
  "generate_minutes": true,
  "template_type": "government"
}
```

**Response:**
```json
{
  "pipeline_id": "pipe-abc",
  "status": "started",
  "steps": ["transcribe", "diarize", "merge", "nlp", "minutes", "rag"]
}
```

---

### GET `/pipeline/status/{pipeline_id}`

Check pipeline status.

**Response:**
```json
{
  "pipeline_id": "pipe-abc",
  "status": "completed",  // running/completed/failed
  "current_step": "rag_indexing",
  "steps": {
    "transcribe": "completed",
    "diarize": "completed",
    "merge": "completed",
    "nlp": "completed",
    "minutes": "completed",
    "rag": "completed"
  },
  "result": {...}
}
```

---

## Models Info

### GET `/models`

List available LLM models via 9router.

**Response:**
```json
{
  "models": [
    {"id": "free-developer", "name": "Free Developer", "provider": "Groq"},
    {"id": "llama-3.1-70b", "name": "Llama 3.1 70B", "provider": "Groq"},
    {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "provider": "Google"}
  ],
  "default": "free-developer"
}
```

---

## WebSocket (Future)

### WS `/transcription/stream`

Real-time streaming transcription (planned).

---

## Rate Limits (Recommended)

| Endpoint | Limit |
|----------|-------|
| `/transcription/transcribe` | 10/minute |
| `/diarization/diarize` | 5/minute |
| `/chat/ask` | 30/minute |
| `/minutes/generate` | 10/minute |
| Others | 60/minute |

---

## SDK Examples

### Python
```python
import httpx

client = httpx.Client(
    base_url="http://localhost:8000/api/v1",
    headers={"X-API-Key": "your-key"}
)

# Transcribe
with open("meeting.wav", "rb") as f:
    resp = client.post("/transcription/transcribe", files={"file": f})
task_id = resp.json()["task_id"]

# Poll status
while True:
    status = client.get(f"/transcription/status/{task_id}").json()
    if status["status"] in ("completed", "failed"):
        break
    time.sleep(2)

# Generate minutes
minutes = client.post("/minutes/generate", json={
    "meeting_id": status["result"]["meeting_id"],
    "template_type": "government"
})
with open("notula.docx", "wb") as f:
    f.write(minutes.content)
```

### cURL
```bash
# Transcribe
curl -X POST "http://localhost:8000/api/v1/transcription/transcribe" \
  -H "X-API-Key: your-key" \
  -F "file=@meeting.wav"

# Check status
curl -H "X-API-Key: your-key" \
  "http://localhost:8000/api/v1/transcription/status/abc123"

# Generate minutes
curl -X POST "http://localhost:8000/api/v1/minutes/generate" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"meeting_id":"meeting-123","template_type":"government"}' \
  --output notula.docx
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-07-11 | Initial release - Full pipeline, 33 endpoints, 65 tests |

---

*Generated: 2024-07-11*