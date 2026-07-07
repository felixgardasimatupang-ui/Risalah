# System Architecture Overview — Risalah SEKNEG AI

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Client Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Next.js  │  │  Mobile  │  │  PWA     │  │ 3rd Party│   │
│  │ Web App  │  │ (Future) │  │ (Future) │  │  API     │   │
│  └─────┬────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────┼────────────────────────────────────────────────────┘
         │ HTTPS / WSS
┌────────┼────────────────────────────────────────────────────┐
│        ▼                                                     │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Next.js   │  │  Nginx   │  │  API GW  │  │  WAF     │  │
│  │  (App/Srv) │  │  Reverse │  │ (Future) │  │          │  │
│  └─────┬──────┘  │  Proxy   │  └──────────┘  └──────────┘  │
│        │         └──────────┘                               │
│        ▼                                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Application Layer                      │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │   REST   │  │   WS     │  │  Stream  │         │     │
│  │  │  API     │  │  Socket  │  │  API     │         │     │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │     │
│  └───────┼──────────────┼─────────────┼───────────────┘     │
│          ▼              ▼             ▼                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Service Layer                          │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │  Auth    │  │  Meeting │  │  Upload  │         │     │
│  │  │  Service │  │  Service │  │  Service │         │     │
│  │  ├──────────┤  ├──────────┤  ├──────────┤         │     │
│  │  │ Transcript│  │ Summary  │  │ Minutes  │         │     │
│  │  │  Service │  │  Service │  │  Service │         │     │
│  │  ├──────────┤  ├──────────┤  ├──────────┤         │     │
│  │  │  Search  │  │  Export  │  │  Notif   │         │     │
│  │  │  Service │  │  Service │  │  Service │         │     │
│  │  └──────────┘  └──────────┘  └──────────┘         │     │
│  └────────────────────────┬───────────────────────────┘     │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────┐     │
│  │              AI Pipeline Layer                      │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │  Speech  │  │  Speaker │  │ Indo NLP │         │     │
│  │  │  Recon   │  │  Diariz. │  │          │         │     │
│  │  ├──────────┤  ├──────────┤  ├──────────┤         │     │
│  │  │  Context │  │  Minutes │  │  AI Chat │         │     │
│  │  │  Understand│  │  Gen    │  │  (RAG)   │         │     │
│  │  │  ing     │  │          │  │          │         │     │
│  │  └──────────┘  └──────────┘  └──────────┘         │     │
│  └────────────────────────────────────────────────────┘     │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────┐     │
│  │              Data Layer                              │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │PostgreSQL│  │  Redis   │  │  Vector  │         │     │
│  │  │          │  │  (Cache/ │  │  DB      │         │     │
│  │  │          │  │   Queue) │  │ (PGVector│         │     │
│  │  │          │  │          │  │  /Qdrant)│         │     │
│  │  └──────────┘  └──────────┘  └──────────┘         │     │
│  │  ┌──────────┐  ┌──────────┐                        │     │
│  │  │  Object  │  │  Message │                        │     │
│  │  │  Storage │  │  Queue   │                        │     │
│  │  │ (S3/S3)  │  │ (Celery) │                        │     │
│  │  └──────────┘  └──────────┘                        │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Principles

1. **Modular Monolith First** — Start as modular monolith within Next.js, extract to microservices only when needed
2. **Async Processing** — All AI workloads run async via message queue (Redis + Celery)
3. **Stateless API** — All API servers are stateless, session state in Redis
4. **Multi-Tenant** — Data isolation by organization (row-level security)
5. **Event-Driven** — Services communicate via events for loose coupling
6. **Streaming First** — Transcript and AI chat use Server-Sent Events (SSE) / WebSocket

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4 | SSR, SEO, App Router |
| Backend | Next.js API Routes + FastAPI (AI) | Unified codebase, Python for AI |
| Database | PostgreSQL 16 | Relational, JSONB, full-text search |
| Cache/Queue | Redis 7 | Pub/sub, rate limiting, job queue |
| Vector DB | PGVector (PostgreSQL extension) | Reduce infra complexity |
| Object Storage | MinIO / S3-compatible | Audio/video/exports |
| Message Queue | Celery + Redis | Async AI task processing |
| Speech-to-Text | Faster Whisper / WhisperX | Optimized for Indonesian |
| Diarization | pyannote-audio 3.1 | Speaker separation |
| LLM | Llama 3 / GPT-4o / Claude | Summarization, chat, NLP |
| Embeddings | Cohere / BGE-M3 | RAG pipeline |
| Monitoring | Grafana + Prometheus + Loki | Observability |
| Container | Docker + Kubernetes | Orchestration |
| CI/CD | GitHub Actions | Automation |

## Service Communication

```
┌──────────┐     REST/GraphQL     ┌──────────┐
│ Frontend │─────────────────────▶│ Backend  │
│ (Next.js)│◀────────────────────│ (API)    │
└──────────┘    JSON Response     └────┬─────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                    ┌─────▼─────┐           ┌───────▼────┐
                    │  Redis    │           │   Celery   │
                    │  Pub/Sub  │◀─────────▶│  Workers   │
                    └───────────┘           │  (AI)      │
                                            └────────────┘
```

## Multi-Tenant Strategy

- **Isolation Model:** Row-level (shared database, isolated by `organization_id`)
- **Authentication:** JWT with organization context
- **Data Access:** All queries scoped to `organization_id` via middleware/repository pattern
- **Storage:** Prefix-based isolation in object storage (`organizations/{org_id}/...`)
- **Rate Limits:** Per-organization
