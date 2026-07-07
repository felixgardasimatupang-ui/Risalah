# API Documentation — Risalah SEKNEG AI

## Base URL

```
Development: http://localhost:3000/api
Production:  https://app.risalah.sekneg.go.id/api
```

## Authentication

All protected endpoints require a JWT token set as an HttpOnly cookie:

```
Cookie: token=<jwt_token>; refresh_token=<refresh_token>
```

Tokens are automatically set by `/api/auth/login` and `/api/auth/register`.

| Credential | TTL | Scope |
|-----------|-----|-------|
| Access Token (JWT) | 15 minutes | All API routes |
| Refresh Token (JWT) | 7 days | `/api/auth/*` only |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `NO_ORGANIZATION` | 400 | User not linked to any organization |
| `FORBIDDEN` | 403 | Insufficient RBAC permissions |
| `VALIDATION_ERROR` | 400 | Missing or invalid request body |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side error |

### Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Meeting not found",
    "details": null
  }
}
```

---

## Auth Endpoints

### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@sekneg.go.id",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@sekneg.go.id",
    "fullName": "John Doe",
    "nip": "198501012010011001",
    "position": "Analis Kebijakan",
    "avatarUrl": null,
    "organization": {
      "id": "uuid",
      "name": "Sekretariat Negara",
      "slug": "sekretariat-negara"
    },
    "role": "admin"
  }
}
```

**Sets Cookies:** `token` (15min), `refresh_token` (7d)

**Audit Logged:** `auth.login`

---

### POST /api/auth/register

Register a new user and optionally create an organization.

**Request Body:**
```json
{
  "email": "user@sekneg.go.id",
  "password": "securepassword123",
  "fullName": "John Doe",
  "nip": "198501012010011001",
  "position": "Analis Kebijakan",
  "organizationName": "Sekretariat Negara"
}
```

**Validation:**
- `email`, `password`, `fullName` required
- Email must be `@sekneg.go.id` domain (validated client-side)
- Duplicate emails return `409 EMAIL_EXISTS`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@sekneg.go.id",
    "fullName": "John Doe",
    "organization": { "id": "uuid", "name": "Sekretariat Negara", "slug": "sekretariat-negara" }
  }
}
```

**Behavior:** If `organizationName` provided, creates org + makes user admin member of that org.

**Audit Logged:** `auth.register`

---

### POST /api/auth/logout

Clear authentication cookies.

**Response (200):**
```json
{ "success": true }
```

---

### GET /api/auth/me

Get current authenticated user's profile with organization context.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@sekneg.go.id",
    "fullName": "John Doe",
    "nip": "198501012010011001",
    "position": "Analis Kebijakan",
    "phone": null,
    "avatarUrl": null,
    "organization": {
      "id": "uuid",
      "name": "Sekretariat Negara",
      "slug": "sekretariat-negara",
      "type": "kementerian"
    },
    "role": "admin"
  }
}
```

---

### POST /api/auth/mfa/setup

Generate TOTP secret and QR code URI for MFA.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "uri": "otpauth://totp/Risalah:user@sekneg.go.id?secret=...&issuer=Risalah"
  }
}
```

---

### POST /api/auth/mfa/verify

Verify a TOTP code during MFA setup or login.

**Request Body:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
```

**Response (200):**
```json
{ "success": true, "data": { "verified": true } }
```

**Error (400):** `{ "success": false, "error": { "code": "INVALID_TOTP", "message": "Invalid or expired token" } }`

---

## Meetings

### GET /api/meetings

List meetings with pagination, filtering, and sorting.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `status` | string | — | Filter: `scheduled`, `in_progress`, `completed`, `cancelled` |
| `search` | string | — | Full-text search on title |
| `date_from` | date | — | Start date (ISO 8601) |
| `date_to` | date | — | End date (ISO 8601) |
| `sort` | string | `date` | Sort field: `date`, `title`, `status` |
| `order` | string | `desc` | Sort order: `asc`, `desc` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "title": "Rapat Koordinasi APBD 2026",
      "description": "Pembahasan anggaran...",
      "date": "2026-01-15T09:00:00Z",
      "status": "completed",
      "durationMinutes": 120,
      "location": "Ruang Rapat Utama",
      "meetingType": "koordinasi",
      "tags": ["APBD", "anggaran"],
      "participants": [{ "id": "uuid", "name": "John Doe", "role": "Ketua" }],
      "_count": { "participants": 12, "audioFiles": 1 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

---

### POST /api/meetings

Create a new meeting.

**Request Body:**
```json
{
  "title": "Rapat Koordinasi APBD 2026",
  "description": "Pembahasan alokasi anggaran...",
  "date": "2026-01-15T09:00:00Z",
  "location": "Ruang Rapat Utama",
  "meetingType": "koordinasi",
  "tags": ["APBD", "anggaran"]
}
```

**Required:** `title`, `date`

**Response (201):**
```json
{ "success": true, "data": { "id": "uuid", "title": "...", ... } }
```

---

### GET /api/meetings/:id

Get meeting details with all related data.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Rapat Koordinasi APBD 2026",
    "description": "...",
    "date": "2026-01-15T09:00:00Z",
    "status": "completed",
    "participants": [{ "id": "uuid", "name": "John Doe", "role": "Ketua", "attendance": "present" }],
    "audioFiles": [{ "id": "uuid", "filename": "rapat.mp3", "status": "completed" }],
    "transcript": {
      "id": "uuid",
      "status": "completed",
      "totalLines": 342,
      "lines": [{ "speakerName": "John Doe", "text": "...", "timestampMs": 120000 }]
    },
    "summary": {
      "id": "uuid",
      "keyPoints": [],
      "actionItems": [],
      "decisions": []
    },
    "minutes": { "id": "uuid", "status": "draft", "content": {} }
  }
}
```

---

### PUT /api/meetings/:id

Update meeting fields.

**Request Body (partial):**
```json
{
  "title": "Updated Title",
  "status": "in_progress",
  "location": "New Room"
}
```

**Response (200):** `{ "success": true, "data": { ... } }`

---

### DELETE /api/meetings/:id

Soft-delete a meeting.

**Response (200):** `{ "success": true }`

---

## Transcripts

### GET /api/transcripts

List transcripts for the organization.

**Query Parameters:** `page`, `limit`, `status`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "meetingId": "uuid",
      "status": "completed",
      "totalLines": 342,
      "confidenceAvg": 0.89,
      "language": "id",
      "meeting": { "id": "uuid", "title": "Rapat APBD", "date": "..." }
    }
  ]
}
```

### GET /api/transcripts/:id

Get transcript with all lines sorted by timestamp.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "meetingId": "uuid",
    "status": "completed",
    "confidenceAvg": 0.89,
    "lines": [
      {
        "id": "uuid",
        "speakerName": "John Doe",
        "text": "Selamat pagi, kita mulai rapat hari ini...",
        "timestampMs": 0,
        "endTimestampMs": 5000,
        "confidence": 0.95
      }
    ],
    "meeting": { "id": "uuid", "title": "Rapat APBD 2026" }
  }
}
```

---

## Summary

### GET /api/summary

List summaries for the organization.

**Query Parameters:** `page`, `limit`, `status`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "meetingId": "uuid",
      "status": "completed",
      "meeting": { "title": "Rapat APBD" }
    }
  ]
}
```

---

## Analytics

### GET /api/analytics/overview

Dashboard-level statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalMeetings": 42,
    "completedMeetings": 35,
    "totalParticipants": 128,
    "avgDuration": 90,
    "totalDurationHours": 63,
    "recentMeetings": [
      { "id": "uuid", "title": "Rapat APBD", "date": "...", "status": "completed", "durationMinutes": 120 }
    ],
    "monthlyTrend": [
      { "month": "2026-01-01T00:00:00Z", "count": 5 }
    ],
    "statusDistribution": [
      { "status": "completed", "count": 35 },
      { "status": "scheduled", "count": 7 }
    ]
  }
}
```

### GET /api/analytics/timeline

Monthly meeting timeline (12 months).

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "month": "2026-01", "count": 5, "duration": 600 },
    { "month": "2026-02", "count": 3, "duration": 360 }
  ]
}
```

### GET /api/analytics/participants

Top participants by meeting count.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "name": "John Doe", "meetingCount": 15, "totalDuration": 1800 }
  ]
}
```

### GET /api/analytics/categories

Meeting distribution by type/category.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "category": "koordinasi", "count": 20 },
    { "category": "evaluasi", "count": 12 }
  ]
}
```

---

## Search

### GET /api/search

Unified search across meetings and transcript lines.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search query (required) |
| `type` | string | `all` | Scope: `meeting`, `transcript`, `all` |
| `meeting_id` | string | — | Scope search to a specific meeting |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "title": "Rapat APBD", "_type": "meeting" },
    { "id": "uuid", "text": "Anggaran APBD...", "speakerName": "John", "_type": "transcript_line" }
  ]
}
```

Search uses case-insensitive `CONTAINS` matching.

---

## Chat

### POST /api/chat/sessions

Create a new AI chat session.

**Request Body:**
```json
{
  "meetingId": "uuid",
  "title": "Diskusi APBD",
  "contextType": "meeting",
  "contextId": "uuid"
}
```

**Response (201):**
```json
{ "success": true, "data": { "id": "uuid", "title": "Diskusi APBD", ... } }
```

### GET /api/chat/sessions

List active chat sessions.

**Query Parameters:** `page`, `limit`

### GET /api/chat/sessions/:id

Get session details with all messages.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Diskusi APBD",
    "contextType": "meeting",
    "messages": [
      { "id": "uuid", "role": "user", "content": "Apa keputusan rapat?", "createdAt": "..." },
      { "id": "uuid", "role": "assistant", "content": "Berdasarkan rapat...", "citations": [...] }
    ]
  }
}
```

### POST /api/chat/sessions/:id/messages

Send a message in a chat session.

**Request Body:**
```json
{
  "content": "Apa keputusan rapat APBD?"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": "assistant",
    "content": "Berdasarkan rapat koordinasi APBD pada 15 Januari 2026, diputuskan bahwa...",
    "citations": [
      { "source": "Rapat APBD", "text": "Anggaran disetujui...", "score": 0.92 }
    ]
  }
}
```

### DELETE /api/chat/sessions/:id

Delete a chat session.

**Response (200):** `{ "success": true }`

---

## Upload

### POST /api/upload

Upload an audio file for processing.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Audio file |
| `meetingId` | string | Yes | Meeting UUID to attach file to |

**Supported Formats:** `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/ogg`, `audio/webm`, `video/mp4`, `video/webm`

**Max File Size:** 500 MB

**Response (200):**
```json
{
  "success": true,
  "data": {
    "filename": "rapat.apbd.2026.mp3",
    "size": 52428800,
    "type": "audio/mpeg",
    "message": "File received. Processing pipeline will start shortly."
  }
}
```

---

## Audit Log

### GET /api/audit

Retrieve audit log entries (admin only). Requires `audit:read` permission.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Max 200 (default 50) |
| `offset` | number | Pagination offset |
| `action` | string | Filter by action type |
| `actor_id` | string | Filter by user ID |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "auth.login",
      "actorId": "uuid",
      "actorEmail": "user@sekneg.go.id",
      "organizationId": "uuid",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-01-15T09:00:00Z"
    }
  ],
  "meta": { "total": 150, "limit": 50, "offset": 0 }
}
```

---

## WebSocket Endpoints

| Path | Description |
|------|-------------|
| `ws://host/ws/meeting/:id/transcript` | Live transcript stream during meetings |
| `ws://host/ws/meeting/:id/status` | Meeting status change notifications |
| `ws://host/ws/notifications` | Real-time notification delivery |

---

## AI Service Endpoints

The AI service runs as a separate FastAPI microservice:

```
Base URL: http://ai-service:8000/api/v1
```

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service status |
| GET | `/api/v1/health` | Health check with model status |

### Transcription

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/transcription/transcribe` | Transcribe audio file (returns segments with timestamps) |
| POST | `/api/v1/transcription/stream` | Streaming transcription (WebSocket) |

### Diarization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/diarization/diarize` | Perform speaker diarization on audio |
| POST | `/api/v1/diarization/identify` | Match speaker segments against known voices |

### NLP

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/nlp/normalize` | Normalize text (numbers, currency, dates, punctuation) |
| POST | `/api/v1/nlp/summarize` | Generate TF-IDF summary from text |

### Government Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/government/extract` | Extract government entities from text |
| GET | `/api/v1/government/knowledge-base` | Get all government terms, institutions, regions |

### Context Understanding

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/context/analyze` | Extract action items, decisions, votes, deadlines |
| POST | `/api/v1/context/action-items` | Extract action items with PIC and priority |

### Minutes Generator

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/minutes/generate` | Generate formatted minutes from meeting data |
| GET | `/api/v1/minutes/templates` | List available minutes templates |

### AI Chat / RAG

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/query` | Ask a question with RAG context (returns answer + citations) |
| POST | `/api/v1/chat/index` | Index a meeting for RAG search |
| DELETE | `/api/v1/chat/index/:meeting_id` | Remove meeting from vector index |

---

## Rate Limiting

- **Default:** 100 requests per minute per user
- **Burst:** 200 requests per minute per user
- **Header:** `X-RateLimit-Remaining` in all API responses
- **Exceeded:** `429 Too Many Requests` with `Retry-After` header

## RBAC Permissions

| Role | Permissions |
|------|-------------|
| `superadmin` | Full access to all resources and settings |
| `admin` | Create/edit meetings, manage members, view analytics, export |
| `member` | View meetings, transcripts, summaries, chat with AI |
| `viewer` | Read-only access to meetings and transcripts |

Permission strings used in guards: `meeting:create`, `meeting:edit`, `meeting:delete`, `member:manage`, `audit:read`, `export:create`, etc.
