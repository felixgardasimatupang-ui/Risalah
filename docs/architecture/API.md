# API Blueprint — Risalah SEKNEG AI

## Base URL

```
Development: http://localhost:3000/api
Production:  https://api.risalah.sekneg.go.id/api
```

## Authentication

All API requests (except auth endpoints) require:

```
Authorization: Bearer <jwt_token>
X-Organization-Id: <org_id>  (for multi-tenant)
```

## API Routes

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user profile |

### Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations` | List user's organizations |
| GET | `/api/organizations/:id` | Get organization details |
| POST | `/api/organizations` | Create organization |
| PUT | `/api/organizations/:id` | Update organization |
| GET | `/api/organizations/:id/members` | List members |
| POST | `/api/organizations/:id/members` | Invite member |
| DELETE | `/api/organizations/:id/members/:userId` | Remove member |

### Meetings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings` | List meetings (paginated, filterable) |
| GET | `/api/meetings/:id` | Get meeting detail |
| POST | `/api/meetings` | Create meeting |
| PUT | `/api/meetings/:id` | Update meeting |
| DELETE | `/api/meetings/:id` | Soft-delete meeting |
| GET | `/api/meetings/:id/participants` | List participants |
| POST | `/api/meetings/:id/participants` | Add participant |
| POST | `/api/meetings/:id/start` | Start meeting (live) |
| POST | `/api/meetings/:id/end` | End meeting |

### Upload & Audio

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/init` | Initiate multipart upload |
| POST | `/api/upload/:id/part` | Upload chunk |
| POST | `/api/upload/:id/complete` | Complete upload |
| POST | `/api/upload/:id/cancel` | Cancel upload |
| GET | `/api/audio/:id/stream` | Stream audio file |
| GET | `/api/audio/:id/url` | Get presigned URL |

### Transcripts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings/:meetingId/transcript` | Get transcript |
| GET | `/api/meetings/:meetingId/transcript/lines` | Get lines (paginated) |
| PUT | `/api/meetings/:meetingId/transcript/lines/:lineId` | Edit line |
| GET | `/api/meetings/:meetingId/transcript/stream` | SSE streaming transcript |
| POST | `/api/meetings/:meetingId/transcript/reprocess` | Request reprocessing |

#### Query Parameters (GET /api/meetings)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `status` | string | Filter by status |
| `search` | string | Full-text search on title |
| `date_from` | date | Start date filter |
| `date_to` | date | End date filter |
| `tag` | string | Filter by tag |
| `sort` | string | Sort field (date, title, status) |
| `order` | string | asc / desc |

### Summaries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings/:meetingId/summary` | Get summary |
| POST | `/api/meetings/:meetingId/summary/regenerate` | Regenerate summary |
| PUT | `/api/meetings/:meetingId/summary/key-points/:kpId` | Edit key point |
| PUT | `/api/meetings/:meetingId/summary/action-items/:aiId` | Update action item |
| PUT | `/api/meetings/:meetingId/summary/decisions/:dId` | Edit decision |

### Minutes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings/:meetingId/minutes` | Get minutes |
| POST | `/api/meetings/:meetingId/minutes` | Create/generate minutes |
| PUT | `/api/meetings/:meetingId/minutes` | Update minutes |
| POST | `/api/meetings/:meetingId/minutes/approve` | Approve minutes |
| POST | `/api/meetings/:meetingId/minutes/export` | Export minutes (format: pdf/docx/txt) |

### AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/sessions` | Create chat session |
| GET | `/api/chat/sessions` | List sessions |
| GET | `/api/chat/sessions/:id` | Get session with messages |
| POST | `/api/chat/sessions/:id/messages` | Send message (SSE response) |
| DELETE | `/api/chat/sessions/:id` | Delete session |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Unified semantic search |
| GET | `/api/search/suggestions` | Search suggestions |

#### Query Parameters (GET /api/search)

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query |
| `type` | string | meeting / transcript / summary / all |
| `scope` | string | organization / meeting |
| `meeting_id` | string | Scope search to meeting |
| `date_from` | date | Start date |
| `date_to` | date | End date |
| `page` | number | Page number |
| `limit` | number | Items per page |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Dashboard stats |
| GET | `/api/analytics/timeline` | Meeting timeline data |
| GET | `/api/analytics/participants` | Participant analytics |
| GET | `/api/analytics/categories` | Category distribution |
| GET | `/api/analytics/trends` | Trend analysis |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings/:meetingId/export` | Trigger export |
| GET | `/api/exports/:id` | Get export status |
| GET | `/api/exports/:id/download` | Download exported file |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

### WebSocket Endpoints

| Path | Description |
|------|-------------|
| `ws://host/ws/meeting/:id/transcript` | Live transcript stream |
| `ws://host/ws/meeting/:id/status` | Meeting status updates |
| `ws://host/ws/notifications` | Real-time notifications |

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "MEETING_NOT_FOUND",
    "message": "Meeting not found",
    "details": null
  }
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |
