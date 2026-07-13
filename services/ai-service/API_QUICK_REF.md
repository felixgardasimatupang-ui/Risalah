# API Quick Reference — Risalah AI Service

## Base URL
```
http://localhost:8000/api/v1
```

## Auth Header
```
X-API-Key: your-secure-api-key
```

---

## Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/docs` | No | Swagger UI |
| GET | `/openapi.json` | No | OpenAPI spec |

### Transcription
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transcription/transcribe` | Transcribe audio file |
| POST | `/transcription/batch` | Batch transcription |
| GET | `/transcription/status/{task_id}` | Check status |
| GET | `/transcription/result/{task_id}` | Get result |

### Diarization
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/diarization/diarize` | Speaker diarization |
| POST | `/diarization/from-path` | Diarize from path |
| GET | `/diarization/status/{task_id}` | Check status |

### NLP
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nlp/normalize` | Text normalization |
| POST | `/nlp/correct` | Grammar correction |
| POST | `/nlp/summarize` | Text summarization |

### Government Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/government/extract` | Extract entities |
| GET | `/government/knowledge-base` | Get KB by category |
| GET | `/government/glossary` | Full glossary |

### Context
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/context/extract` | Full context extraction |
| POST | `/context/action-items` | Action items only |
| POST | `/context/decisions` | Decisions only |

### Minutes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/minutes/generate` | Generate DOCX |
| GET | `/minutes/templates` | List templates |
| GET | `/minutes/templates/{type}` | Get template |

### Chat / RAG
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/ask` | Ask with RAG |
| POST | `/chat/index` | Index meeting |
| DELETE | `/chat/index/{meeting_id}` | Delete index |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meetings` | List (paginated) |
| GET | `/meetings/{id}` | Get detail |
| DELETE | `/meetings/{id}` | Delete |
| PATCH | `/meetings/{id}/status` | Update status |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meetings/{id}/export` | Download DOCX |

### Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pipeline/run` | Run full pipeline |
| GET | `/pipeline/status/{id}` | Check status |

### Models
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/models` | List LLM models |

---

## Request/Response Examples

### Transcribe Audio
```bash
curl -X POST "http://localhost:8000/api/v1/transcription/transcribe" \
  -H "X-API-Key: your-key" \
  -F "file=@meeting.wav" \
  -F "language=id" \
  -F "diarize=true"
# → {"task_id": "abc", "status": "queued"}
```

### Check Status
```bash
curl -H "X-API-Key: your-key" \
  "http://localhost:8000/api/v1/transcription/status/abc"
# → {"task_id": "abc", "status": "completed", "result": {...}}
```

### Normalize Text
```bash
curl -X POST "http://localhost:8000/api/v1/nlp/normalize" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"text": "Rapat 12 orang pukul 09.00, budget 5.000.000", "normalize_numbers": true}'
# → {"normalized": "Rapat dua belas orang pukul 09.00, budget lima juta rupiah.", "changes": [...]}
```

### Extract Gov Entities
```bash
curl -X POST "http://localhost:8000/api/v1/government/extract" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"text": "Gubernur DKI hadir di rapat APBD DPRD"}'
# → {"entities": [{"text": "Gubernur", "category": "jabatan", ...}, ...]}
```

### Context Extraction
```bash
curl -X POST "http://localhost:8000/api/v1/context/extract" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bapak Andi ditugaskan laporan hingga Jumat. Saya setuju.", "participants": ["Bapak Andi"]}'
# → {"action_items": [...], "decisions": [...], "interruptions": [], "deadlines": [...]}
```

### Generate Minutes
```bash
curl -X POST "http://localhost:8000/api/v1/minutes/generate" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": "meeting-123",
    "template_type": "government",
    "title": "Rapat Koordinasi",
    "date": "2024-01-15",
    "location": "Ruang Rapat",
    "participants": ["Dr. Budi"],
    "transcript": [],
    "action_items": [],
    "decisions": []
  }' \
  --output notula.docx
```

### Chat with RAG
```bash
curl -X POST "http://localhost:8000/api/v1/chat/ask" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Apa keputusan anggaran?", "meeting_ids": ["meeting-123"]}'
# → {"answer": "Rapat menyetujui anggaran...", "citations": [...], "model_used": "free-developer"}
```

### Index Meeting for RAG
```bash
curl -X POST "http://localhost:8000/api/v1/chat/index" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"meeting_id": "meeting-123"}'
```

### List Meetings
```bash
curl -H "X-API-Key: your-key" \
  "http://localhost:8000/api/v1/meetings?page=1&size=20"
```

### Get Meeting Detail
```bash
curl -H "X-API-Key: your-key" \
  "http://localhost:8000/api/v1/meetings/meeting-123"
```

### Update Status
```bash
curl -X PATCH "http://localhost:8000/api/v1/meetings/meeting-123/status" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Export DOCX
```bash
curl -H "X-API-Key: your-key" \
  "http://localhost:8000/api/v1/meetings/meeting-123/export" \
  --output notula.docx
```

### Run Full Pipeline
```bash
curl -X POST "http://localhost:8000/api/v1/pipeline/run" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_path": "/data/audio/meeting-123.wav",
    "meeting_id": "meeting-123",
    "language": "id",
    "diarize": true,
    "generate_minutes": true,
    "template_type": "government"
  }'
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid API key |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Request body invalid |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Model loading |

---

## Templates
- `government` - Notula Rapat Pemerintah (standar)
- `dprd` - Notula Rapat DPRD
- `bumn` - Notula Rapat BUMN
- `custom` - Custom template

---

*Quick Reference v1.0.0*