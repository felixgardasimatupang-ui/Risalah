# Deployment Guide — Risalah SEKNEG AI

## Prerequisites

- Node.js 22+
- Python 3.12+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7
- MinIO or S3-compatible storage
- NVIDIA GPU + CUDA 12 (for AI workers, optional)

---

## 1. Development Setup

### 1.1 Clone & Install

```bash
git clone https://github.com/sekneg/risalah.git
cd risalah

# Install Node.js dependencies
npm install

# Install AI service dependencies
cd services/ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download id_core_news_sm
cd ../..
```

### 1.2 Environment Variables

```bash
cp .env.example .env.local
```

Required variables:

```
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/risalah"

# Auth
JWT_SECRET="your-256-bit-secret"

# Encryption (AES-256-GCM)
ENCRYPTION_KEY="your-32-byte-hex-key"

# MinIO / S3
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="risalah-audio"

# AI Service
AI_SERVICE_URL="http://localhost:8000"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 1.3 Database Setup

```bash
# Push Prisma schema to database
npx prisma db push

# (Optional) Seed demo data
npx tsx scripts/seed.ts
```

### 1.4 Start Development Servers

```bash
# Terminal 1: Database + Cache
docker compose up postgres redis minio -d

# Terminal 2: Next.js app
npm run dev

# Terminal 3: AI service
cd services/ai-service
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

App runs at `http://localhost:3000`  
AI service at `http://localhost:8000`  
API docs (Swagger) at `http://localhost:8000/docs`

---

## 2. Docker Deployment

### 2.1 Build Images

```bash
# Build Next.js app
docker build -t risalah-app:latest .

# Build AI service
docker build -t risalah-ai:latest services/ai-service

# Build AI service (GPU variant)
docker build -t risalah-ai:gpu -f services/ai-service/Dockerfile.gpu services/ai-service
```

### 2.2 Full Stack with Docker Compose

```bash
docker compose up -d
```

This starts:
- `risalah-app` — Next.js application (port 3000)
- `risalah-ai` — FastAPI AI service (port 8000)
- `postgres` — PostgreSQL 16 (port 5432)
- `redis` — Redis 7 (port 6379)
- `minio` — Object storage (port 9000, console 9001)
- `postgres-exporter` — DB metrics
- `redis-exporter` — Cache metrics

---

## 3. Production Deployment (Kubernetes)

### 3.1 Prerequisites

- Kubernetes cluster (v1.28+)
- kubectl configured
- Ingress controller (Nginx ingress)
- cert-manager for TLS
- Persistent volumes for PostgreSQL and MinIO

### 3.2 Namespaces

```bash
kubectl apply -f k8s/namespaces.yaml
```

| Namespace | Purpose |
|-----------|---------|
| `risalah-app` | Next.js application |
| `risalah-ai` | AI workers and services |
| `risalah-data` | PostgreSQL, Redis, MinIO |
| `risalah-infra` | Monitoring, logging |

### 3.3 Deploy Data Layer

```bash
# PostgreSQL
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# Redis
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-pvc.yaml
kubectl apply -f k8s/redis-service.yaml

# MinIO
kubectl apply -f k8s/minio-statefulset.yaml
kubectl apply -f k8s/minio-service.yaml
```

### 3.4 Deploy Application

```bash
# ConfigMap with environment variables
kubectl apply -f k8s/configmap.yaml

# Application
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml

# AI Service
kubectl apply -f k8s/ai-deployment.yaml
kubectl apply -f k8s/ai-service.yaml
```

### 3.5 Configure Ingress

```bash
kubectl apply -f k8s/ingress.yaml
```

### 3.6 Network Policies

```bash
kubectl apply -f k8s/network-policies.yaml
```

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions

Two workflows are configured:

**CI** (`.github/workflows/ci.yml`) — runs on every push:

1. Lint & TypeScript check
2. Unit tests (Vitest)
3. Build Next.js app
4. AI service lint (Python syntax check)

**Deploy** (`.github/workflows/deploy.yml`) — runs on push to `main`:

1. Build Docker images
2. Push to GitHub Container Registry (GHCR)
3. Deploy to staging
4. Run integration & E2E tests
5. Deploy to production (rolling update)

### 4.2 Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `KUBE_CONFIG` | kubeconfig for production cluster |
| `GHCR_TOKEN` | GitHub Container Registry token |
| `DATABASE_URL` | Production database URL |
| `JWT_SECRET` | JWT signing secret |
| `ENCRYPTION_KEY` | AES encryption key |
| `SENTRY_DSN` | Error tracking DSN |

---

## 5. Monitoring

### 5.1 Stack

- **Prometheus** — Metrics collection
- **Loki** — Log aggregation
- **Grafana** — Dashboards & alerting
- **Node Exporter** — Host metrics

### 5.2 Start Monitoring

```bash
docker compose -f monitoring/docker-compose.monitoring.yml up -d
```

Access:
- Grafana: `http://localhost:3001` (admin/admin)
- Prometheus: `http://localhost:9090`

### 5.3 Available Dashboards

- **Risalah Overview** — App metrics, request rates, error rates
- **AI Pipeline** — Transcription latency, queue depth, GPU utilization
- **Database** — Query performance, connection pool, replication lag
- **Infrastructure** — CPU, memory, disk, network

### 5.4 Logging

Loki collects logs from all services:

```bash
# Query logs via Grafana Explore
{app="risalah-app"} |= "error"

# AI service logs
{app="risalah-ai"} |= "transcription"
```

---

## 6. Backup & Restore

### 6.1 Automated Backups

The backup script runs via cron in the cluster:

```bash
# Manual backup
./scripts/backup.sh

# Backup includes:
# - PostgreSQL dump (compressed)
# - WAL archives (continuous)
# - Redis RDB snapshot
# - MinIO buckets (S3 sync)
```

### 6.2 Retention Policy

| Data | Frequency | Retention |
|------|-----------|-----------|
| PostgreSQL | Every 6 hours | 30 days |
| WAL (PITR) | Continuous | 7 days |
| Object Storage | Daily | 90 days |
| Redis | Hourly | 24 hours |

### 6.3 Restore

```bash
# List available backups
./scripts/restore.sh --list

# Restore database from specific backup
./scripts/restore.sh --db --date 2026-01-15

# Full restore (all services)
./scripts/restore.sh --all --date 2026-01-15
```

---

## 7. GPU Configuration

### 7.1 AI Workload Requirements

| Workload | GPU | VRAM | Model |
|----------|-----|------|-------|
| Speech Recognition | 1x RTX 4090 / A10G | 16 GB | Faster-Whisper large-v3 |
| Speaker Diarization | 1x A10G | 16 GB | pyannote-audio 3.3 |
| LLM Inference | 1x A100 | 40 GB | Llama 3 / Mixtral |

### 7.2 Enable GPU in Docker Compose

Edit `docker-compose.yml` to uncomment the GPU section:

```yaml
services:
  ai-service:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ["0"]
              capabilities: [gpu]
```

### 7.3 Kubernetes GPU

```bash
kubectl apply -f k8s/ai-deployment-gpu.yaml
```

Requires NVIDIA GPU Operator installed in the cluster.

---

## 8. Scaling

### 8.1 Horizontal Scaling

```bash
# Scale application pods
kubectl scale deployment risalah-app --replicas=5

# Scale AI workers (CPU tasks)
kubectl scale deployment risalah-ai --replicas=3

# Scale AI workers (GPU — max 1 per GPU)
kubectl scale deployment risalah-ai-gpu --replicas=2
```

### 8.2 Vertical Scaling

| Component | Production Spec |
|-----------|----------------|
| Next.js | 2 vCPU, 4 GB RAM |
| PostgreSQL | 4 vCPU, 16 GB RAM, 500 GB SSD |
| Redis | 2 vCPU, 8 GB RAM, 50 GB |
| AI Worker (CPU) | 4 vCPU, 16 GB RAM |
| AI Worker (GPU) | 8 vCPU, 32 GB RAM, 1x A10G |

---

## 9. Troubleshooting

### Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Database connection failed | `docker compose logs postgres` | Check `DATABASE_URL` env |
| AI service crash | `docker compose logs ai-service` | Check GPU driver, CUDA version |
| Upload fails | Check MinIO console at `:9001` | Verify S3 credentials |
| Build fails | `npm run build` output | Run `npx next lint` first |
| Token expired | 401 on API calls | Login again via `/login` |
| MFA locked | 5+ failed attempts | Contact admin to reset |

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/auth/me

# AI service health
curl http://localhost:8000/api/v1/health

# Database
docker compose exec postgres pg_isready

# Redis
docker compose exec redis redis-cli ping
```
