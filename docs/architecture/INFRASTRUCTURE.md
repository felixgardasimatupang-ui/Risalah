# Infrastructure Architecture

## Environment Overview

```
┌────────────────────────────────────────────────────┐
│                  Production Cluster                │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  K8s Node 1 │  │  K8s Node 2 │  │  GPU Node │  │
│  │  (App)      │  │  (App)      │  │  (AI)     │  │
│  │  - Next.js  │  │  - Next.js  │  │  - Whisper│  │
│  │  - Redis    │  │  - Celery   │  │  - pyannote│  │
│  │  - API      │  │  - API      │  │  - LLM    │  │
│  └─────────────┘  └─────────────┘  └───────────┘  │
└────────────────────────────────────────────────────┘
```

## Kubernetes Architecture

```yaml
# High-level namespace layout
namespaces:
  - risalah-app       # Next.js, API, WebSocket
  - risalah-ai        # AI workers, ML models
  - risalah-data      # PostgreSQL, Redis, Vector DB
  - risalah-infra     # Monitoring, Logging, Ingress
```

## Service Specifications

### Web Tier
| Service | Replicas | CPU | Memory | Storage |
|---------|----------|-----|--------|---------|
| Next.js (SSR) | 2-4 | 2 vCPU | 4 GB | - |
| API Server | 2-4 | 2 vCPU | 4 GB | - |
| WebSocket | 2 | 1 vCPU | 2 GB | - |

### Data Tier
| Service | Replicas | CPU | Memory | Storage |
|---------|----------|-----|--------|---------|
| PostgreSQL | Primary + Replica | 4 vCPU | 16 GB | 500 GB SSD |
| Redis | 3 (cluster) | 2 vCPU | 8 GB | 50 GB |
| PGVector | Same as PostgreSQL | - | - | - |

### AI Tier (GPU)
| Service | GPU | CPU | Memory |
|---------|-----|-----|--------|
| Whisper Worker | 1x NVIDIA A10G/RTX 4090 | 4 vCPU | 16 GB |
| Diarization Worker | 1x NVIDIA A10G | 4 vCPU | 16 GB |
| LLM Inference | 1-2x NVIDIA A100 | 8 vCPU | 32 GB |

### Storage
| Type | Solution | Size | Backup |
|------|----------|------|--------|
| Object Storage | MinIO / S3 | 2 TB | Daily snapshot |
| Database | PostgreSQL | 500 GB | PITR (7 days) |
| Cache | Redis | 50 GB | RDB/AOF |

## Network Architecture

```
Internet
   │
   ▼
┌──────────┐
│  CloudFlare / WAF
└────┬─────┘
     │
     ▼
┌──────────┐
│  Nginx   │  (Reverse Proxy, SSL termination, rate limiting)
│  Ingress │
└────┬─────┘
     │
     ├──────────────────┐
     ▼                  ▼
┌──────────┐    ┌──────────────┐
│  Next.js │    │  WebSocket   │
│  (App)   │    │  Server      │
└──────────┘    └──────────────┘
     │
     ▼
┌──────────┐
│  API     │
│  Gateway │
└────┬─────┘
     │
     ├──────────┬──────────┬──────────┐
     ▼          ▼          ▼          ▼
  Auth Svc  Meeting    AI Queue   Export
             Svc        (Redis)    Svc
                        │
                        ▼
                    ┌──────────┐
                    │ Celery   │
                    │ Worker   │
                    │ (GPU)    │
                    └──────────┘
```

## CI/CD Pipeline

```
Git Push (main)
   │
   ▼
┌──────────────┐
│ GitHub       │
│ Actions      │
└──────┬───────┘
       │
       ├── Lint & TypeCheck
       ├── Unit Tests
       ├── Build Docker Images
       │
       ▼
┌──────────────┐
│ Docker       │
│ Registry     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Deploy       │
│ Staging      │
└──────┬───────┘
       │
       ├── Integration Tests
       ├── E2E Tests
       ├── AI Accuracy Tests
       │
       ▼
┌──────────────┐
│ Deploy       │
│ Production   │
│ (Rolling)    │
└──────────────┘
```

## Monitoring Stack

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│Prometheus│    │   Loki   │    │  Tempo   │
│ (Metrics)│    │ (Logs)   │    │ (Traces) │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
                     ▼
              ┌──────────┐
              │  Grafana │
              │ (Dashboards)│
              └──────────┘

Alerting: PagerDuty / Slack
Uptime:   Status page
APM:      Sentry / OpenTelemetry
```

## Backup Strategy

| Data | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| PostgreSQL | Every 6 hours | 30 days | pg_dump + WAL archiving |
| PostgreSQL (PITR) | Continuous | 7 days | WAL streaming |
| Object Storage | Daily | 90 days | S3 sync |
| Redis | Every hour | 24 hours | RDB snapshots |
| Application Config | On change | Git history | GitOps |

## Security Infrastructure

- **WAF:** Cloudflare / ModSecurity for OWASP protection
- **DDoS:** Cloudflare DDoS protection
- **Rate Limiting:** 100 req/min per user, 1000 req/min per organization
- **Encryption:** TLS 1.3 for all traffic, AES-256 at rest
- **Auth:** JWT with 15min access + 7 day refresh tokens
- **Audit Log:** All mutation operations logged with user, timestamp, IP
- **Network:** Private subnet for database, no public access
- **Secrets:** HashiCorp Vault / Kubernetes Secrets
