# Prompts — Phase 15 Integration

## Integrasi Sistem
```
Bantu integrasi komponen sistem AI Notulen Pemerintahan.

1. Backend ↔ PostgreSQL (SQLAlchemy ORM)
2. Backend ↔ MinIO/S3 (file storage)
3. Backend ↔ Redis (Celery queue)
4. Backend ↔ AI Pipeline (subprocess/service call)
5. Frontend ↔ Backend (REST API + WebSocket)
6. Frontend ↔ AI Chat (streaming response)

Pastikan:
- Error handling di setiap integrasi point
- Retry mechanism untuk transient failures
- Logging di setiap integration boundary
- Health check endpoint
```
