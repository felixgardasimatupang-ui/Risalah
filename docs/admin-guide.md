# Admin Guide — Risalah SEKNEG AI

Panduan untuk administrator sistem dan organisasi.

---

## Table of Contents

1. [Role-Based Access Control](#1-role-based-access-control)
2. [User Management](#2-user-management)
3. [Organization Settings](#3-organization-settings)
4. [Audit Log](#4-audit-log)
5. [Security](#5-security)
6. [Monitoring & Alerts](#6-monitoring--alerts)
7. [Backup & Recovery](#7-backup--recovery)
8. [AI Pipeline Management](#8-ai-pipeline-management)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Role-Based Access Control

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| `superadmin` | System-wide | Full access across all organizations |
| `admin` | Organization | Manage meetings, members, settings |
| `member` | Organization | Create/view meetings, transcripts, chat |
| `viewer` | Organization | Read-only access to meetings & transcripts |

### Permission Matrix

| Permission | superadmin | admin | member | viewer |
|-----------|------------|-------|--------|--------|
| `meeting:create` | ✅ | ✅ | ✅ | ❌ |
| `meeting:edit` | ✅ | ✅ | ✅ | ❌ |
| `meeting:delete` | ✅ | ✅ | ❌ | ❌ |
| `transcript:view` | ✅ | ✅ | ✅ | ✅ |
| `transcript:edit` | ✅ | ✅ | ✅ | ❌ |
| `summary:view` | ✅ | ✅ | ✅ | ✅ |
| `minutes:approve` | ✅ | ✅ | ❌ | ❌ |
| `member:manage` | ✅ | ✅ | ❌ | ❌ |
| `audit:read` | ✅ | ✅ | ❌ | ❌ |
| `export:create` | ✅ | ✅ | ✅ | ❌ |
| `settings:edit` | ✅ | ✅ | ❌ | ❌ |

### Managing Roles

Roles are assigned per organization membership:

```typescript
// src/lib/rbac.ts
const ROLES = {
  superadmin: [...allPermissions],
  admin: [
    "meeting:create", "meeting:edit", "meeting:delete",
    "member:manage", "audit:read", "export:create",
    "settings:edit",
  ],
  member: [
    "meeting:create", "meeting:edit",
    "transcript:view", "transcript:edit",
    "summary:view", "export:create",
  ],
  viewer: [
    "transcript:view", "summary:view",
  ],
};
```

---

## 2. User Management

### Invite Members

Admins can add members to their organization through the Settings → Organization page:

1. Navigate to **Settings → Organization**
2. Click **Tambah Anggota**
3. Enter email address (must be `@sekneg.go.id`)
4. Select role (`admin`, `member`, `viewer`)
5. Click **Undang**

### Member Actions

| Action | Description |
|--------|-------------|
| View | See all members with roles, join dates, activity |
| Change Role | Promote/demote member role |
| Remove | Remove member from organization |
| Deactivate | Temporarily disable access (preserves data) |

### User States

- **Active** — Normal access
- **Inactive** — Cannot login, data preserved
- **Deleted** — Account removed (soft-delete, admin recovery possible)

---

## 3. Organization Settings

Access via **Settings → Organization** tab (admin only).

### Organization Information

- **Nama** — Organization name
- **Tipe** — Type: `kementerian`, `pemda`, `dprd`, `bumn`, `universitas`
- **Domain** — Email domain for auto-join
- **Alamat, Telepon, Email** — Contact information

### Billing

- **Plan:** Enterprise (unlimited meetings, users, storage)
- **Usage:** Meeting count, storage used, API calls
- **History:** Payment records

---

## 4. Audit Log

All mutation operations are recorded for compliance and security.

### Logged Actions

| Category | Actions |
|----------|---------|
| Authentication | `auth.login`, `auth.register`, `auth.logout`, `auth.mfa_setup`, `auth.mfa_verify` |
| Meetings | `meeting.create`, `meeting.update`, `meeting.delete`, `meeting.start`, `meeting.end` |
| Transcripts | `transcript.edit`, `transcript.reprocess` |
| Summaries | `summary.regenerate`, `summary.edit_keypoint`, `summary.edit_decision` |
| Minutes | `minutes.create`, `minutes.update`, `minutes.approve`, `minutes.export` |
| Members | `member.invite`, `member.remove`, `member.role_change` |
| Settings | `settings.update`, `organization.update` |

### View Audit Log

```http
GET /api/audit?action=auth.login&limit=50
```

Requires `audit:read` permission (admin+).

### Audit Log Fields

| Field | Description |
|-------|-------------|
| `id` | Unique entry ID |
| `action` | Action identifier |
| `actorId` | User who performed the action |
| `actorEmail` | Email of the actor |
| `organizationId` | Organization context |
| `resourceId` | Affected resource (e.g., meeting ID) |
| `resourceType` | Resource type (meeting, user, etc.) |
| `metadata` | Additional context (JSON) |
| `ip` | Client IP address |
| `userAgent` | Browser/client identifier |
| `timestamp` | When the action occurred |

---

## 5. Security

### Multi-Factor Authentication (MFA/TOTP)

Users can enable MFA via **Settings → Security**.

**How to set up:**
1. Go to Settings → Security → **Aktifkan MFA**
2. Scan the QR code with Google Authenticator / Authy
3. Enter the 6-digit code to verify
4. MFA is now active

**Login with MFA:**
1. Enter email and password
2. Enter 6-digit TOTP code from authenticator app
3. Access granted

MFA uses TOTP (HMAC-SHA1, 30-second window, 6 digits, ±1 step drift tolerance).

### Password Policy

- Minimum 8 characters
- Hashed with bcrypt (12 rounds)
- No plain-text storage
- Session tokens rotated every 15 minutes

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Per user (standard) | 100 requests | 1 minute |
| Per user (burst) | 200 requests | 1 minute |
| Per organization | 1000 requests | 1 minute |

Rate-limited requests receive:
```
HTTP 429 Too Many Requests
Retry-After: 60
```

### Security Headers

All responses include:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | Restricts scripts, styles, fonts to trusted origins |
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains |
| `X-Frame-Options` | DENY |
| `X-Content-Type-Options` | nosniff |
| `X-XSS-Protection` | 1; mode=block |
| `Referrer-Policy` | strict-origin-when-cross-origin |
| `Permissions-Policy` | camera=(), microphone=() |

### Encryption

- **In Transit:** TLS 1.3 for all traffic
- **At Rest:** AES-256-GCM for sensitive data
- **Audio Files:** Encrypted in object storage (MinIO SSE-S3)
- **Database:** Column-level encryption for PII

---

## 6. Monitoring & Alerts

### Dashboards

Accessible via Grafana at `https://grafana.risalah.sekneg.go.id`.

**Risalah Overview Dashboard:**
- Request rate (RPS) per endpoint
- Error rate (5xx, 4xx)
- p50/p95/p99 response latency
- Active WebSocket connections
- Queue depth (AI processing)

**AI Pipeline Dashboard:**
- Transcription jobs queued / processing / completed
- Average processing time per audio minute
- GPU utilization (NVML metrics)
- Model inference latency
- WER/CER trends over time

**Database Dashboard:**
- Active connections
- Query execution time (p50/p95)
- Table size growth
- Cache hit ratio (Redis)
- Replication lag

### Alert Rules

| Alert | Threshold | Severity | Channel |
|-------|-----------|----------|---------|
| High error rate | >5% 5xx in 5 min | Critical | Slack + Email |
| Queue backlog | >100 pending jobs | Warning | Slack |
| Low disk space | <10% free on PostgreSQL volume | Critical | Slack + Email |
| GPU temperature | >85°C | Warning | Slack |
| AI accuracy drop | WER >15% in 1 hour | Warning | Slack |

### Logging

All services log to stdout in JSON format, collected by Loki:

```json
{"level":"error","service":"app","message":"Transcription failed","meetingId":"uuid","error":"..."}
```

**Log queries (Grafana Explore):**
```
{app="risalah-app"} |= "error"
{app="risalah-ai", level="error"}
{namespace="risalah-data", app="postgres"}
```

---

## 7. Backup & Recovery

### Automated Backup Schedule

| Data | Frequency | Method | Retention |
|------|-----------|--------|-----------|
| PostgreSQL | Every 6 hours | `pg_dump` + WAL archiving | 30 days |
| PostgreSQL (PITR) | Continuous | WAL streaming | 7 days |
| MinIO / Object Storage | Daily | `s3 sync` | 90 days |
| Redis | Hourly | RDB snapshots | 24 hours |
| App Config | On change | Git (GitOps) | Full history |

### Manual Backup

```bash
# Full backup
./scripts/backup.sh

# Database only
./scripts/backup.sh --db-only

# Storage only
./scripts/backup.sh --storage-only
```

### Restore

```bash
# List backups
./scripts/restore.sh --list

# Restore database to specific point in time
./scripts/restore.sh --db --timestamp "2026-01-15 09:00:00"

# Restore from latest backup
./scripts/restore.sh --db --latest

# Full restore
./scripts/restore.sh --all --date 2026-01-15
```

### Disaster Recovery

1. **Database corruption:** Restore from latest WAL archive (PITR)
2. **Storage failure:** Restore from daily MinIO sync
3. **Full cluster failure:** Deploy K8s manifests from Git, restore from off-site backup
4. **Data breach:** Rotate all secrets, audit all sessions, restore from pre-incident backup

---

## 8. AI Pipeline Management

### Pipeline Steps

1. **Upload** → Audio file received and stored in MinIO
2. **Transcription** → Whisper large-v3 processes audio (GPU)
3. **Diarization** → pyannote-audio identifies speakers
4. **NLP** → Indonesian text normalization, punctuation
5. **Context** → Extract action items, decisions, entities
6. **Summary** → LLM generates structured summary
7. **Minutes** → Template-based minutes generation
8. **Index** → Embeddings created for RAG search

### Monitoring Pipeline

```bash
# Check queue depth
redis-cli LLEN celery

# View active workers
celery -A app.services.celery_app inspect active

# Check GPU utilization
nvidia-smi -l 1
```

### Re-processing

If a transcription fails or needs improvement:

1. Navigate to the meeting detail
2. Go to **Transkrip** tab
3. Click **Proses Ulang**
4. The file is re-queued for AI processing

### AI Accuracy Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| WER (Word Error Rate) | <10% | Transcrip vs. ground truth |
| CER (Character Error Rate) | <5% | Character-level accuracy |
| Speaker Error Rate | <5% | Speaker attribution accuracy |
| Hallucination Rate | <2% | Fabricated content in summary |
| Minutes Accuracy | >95% | Correct government terminology |
| Action Item Accuracy | >90% | Correct extraction of tasks + PIC |

Run evaluation:

```bash
npm run test:ai
# or
python services/ai-service/tests/evaluate.py
```

---

## 9. Troubleshooting

### Common Admin Issues

**User cannot login:**
1. Check if account is active: `SELECT is_active FROM users WHERE email = '...'`
2. Verify email domain: Must be `@sekneg.go.id`
3. Check audit log for failed attempts: `GET /api/audit?action=auth.login`

**Transcription stuck on "processing":**
1. Check AI service health: `curl http://ai-service:8000/api/v1/health`
2. Verify Redis queue: `redis-cli LLEN celery`
3. Check GPU availability: `nvidia-smi`
4. Restart AI worker: `kubectl rollout restart deployment risalah-ai`

**Upload failing:**
1. Check MinIO status: Access console at `http://minio-console:9001`
2. Verify storage quota: `df -h /data/minio`
3. Check file format and size limits

**High latency or errors:**
1. Check Grafana dashboard for bottlenecks
2. Scale pods: `kubectl scale deployment risalah-app --replicas=5`
3. Check PostgreSQL slow query log
4. Increase Redis maxmemory if eviction happening

### Health Check Endpoints

```bash
# Application
curl https://app.risalah.sekneg.go.id/api/auth/me

# AI Service
curl http://ai-service:8000/api/v1/health

# Database
pg_isready -h postgres -U risalah

# Redis
redis-cli -h redis ping

# MinIO
curl http://minio:9000/minio/health/live
```

### Useful Database Queries

```sql
-- Active meetings today
SELECT COUNT(*) FROM meetings WHERE date::date = CURRENT_DATE;

-- Processing status
SELECT status, COUNT(*) FROM meetings GROUP BY status;

-- Top participants
SELECT p.name, COUNT(*) as meetings
FROM participants p
JOIN meetings m ON p.meeting_id = m.id
WHERE m.organization_id = 'org-uuid'
GROUP BY p.name
ORDER BY meetings DESC
LIMIT 10;

-- Recent errors
SELECT action, COUNT(*) FROM audit_log
WHERE timestamp > NOW() - INTERVAL '24 hours'
AND metadata->>'error' IS NOT NULL
GROUP BY action;
```
