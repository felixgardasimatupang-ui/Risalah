# Deployment Guide — Risalah AI Service

## Overview

Panduan deployment untuk Risalah AI Service di berbagai environment: development, staging, dan production.

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended (Production) |
|-----------|---------|-------------------------|
| CPU | 4 cores | 8+ cores |
| RAM | 16 GB | 32+ GB |
| GPU | Optional | NVIDIA 16GB+ VRAM (RTX 3090/4090, A100) |
| Disk | 50 GB | 200+ GB SSD/NVMe |
| OS | Ubuntu 22.04+ | Ubuntu 22.04 LTS |

### Software Dependencies

```bash
# Ubuntu 22.04
apt update && apt install -y \
    python3.10 python3.10-venv python3.10-dev \
    redis-server \
    postgresql-14 postgresql-client-14 \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    build-essential \
    cmake \
    pkg-config \
    libssl-dev \
    libffi-dev

# NVIDIA GPU (if using GPU)
# Follow https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html
```

---

## 1. Development Deployment

### Quick Start (Docker Compose)

```bash
cd services/ai-service

# Copy environment
cp .env.example .env
# Edit .env as needed

# Start services
docker-compose up -d ai-service redis

# View logs
docker-compose logs -f ai-service

# Run tests
docker-compose exec ai-service python -m pytest tests/ -v
```

### Manual (Without Docker)

```bash
cd services/ai-service

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Download spaCy model
python -m spacy download id_core_news_sm

# Copy and configure environment
cp .env.example .env
# Edit .env

# Run database migrations
alembic upgrade head

# Start Redis (separate terminal)
redis-server

# Start Celery workers (separate terminal)
celery -A app.celery_app worker --loglevel=info -Q transcription,diarization,nlp,minutes,rag,export,cleanup

# Start Celery beat (separate terminal)
celery -A app.celery_app beat --loglevel=info

# Start API server
uvicorn app.main:app --reload --port 8000
```

---

## 2. Staging Deployment

### Docker Compose (Staging)

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  ai-service:
    build:
      context: .
      dockerfile: Dockerfile
    image: risalah/ai-service:staging
    container_name: risalah-ai-staging
    restart: unless-stopped
    environment:
      - RISALAH_DEBUG=false
      - RISALAH_API_KEY=${STAGING_API_KEY}
      - RISALAH_DATABASE_URL=postgresql+asyncpg://risalah:pass@postgres:5432/risalah_staging
      - RISALAH_HUGGINGFACE_TOKEN=${HF_TOKEN}
      - RISALAH_NINE_ROUTER_KEY=${NINE_ROUTER_KEY}
    volumes:
      - staging_audio:/data/audio
      - staging_transcripts:/data/transcripts
      - staging_exports:/data/exports
      - staging_vector:/data/vector_db
    ports:
      - "8001:8000"
    depends_on:
      - postgres
      - redis
    deploy:
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G

  celery-worker:
    build: .
    image: risalah/ai-service:staging
    command: celery -A app.celery_app worker --loglevel=info -Q transcription,diarization,nlp,minutes,rag,export,cleanup
    environment:
      - RISALAH_DEBUG=false
      - RISALAH_DATABASE_URL=postgresql+asyncpg://risalah:pass@postgres:5432/risalah_staging
      - RISALAH_HUGGINGFACE_TOKEN=${HF_TOKEN}
    volumes:
      - staging_audio:/data/audio
      - staging_transcripts:/data/transcripts
      - staging_exports:/data/exports
      - staging_vector:/data/vector_db
    depends_on:
      - postgres
      - redis
    deploy:
      resources:
        limits:
          memory: 6G

  celery-beat:
    build: .
    image: risalah/ai-service:staging
    command: celery -A app.celery_app beat --loglevel=info
    environment:
      - RISALAH_DATABASE_URL=postgresql+asyncpg://risalah:pass@postgres:5432/risalah_staging
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: risalah_staging
      POSTGRES_USER: risalah
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - staging_pgdata:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - staging_redis:/data
    ports:
      - "6380:6379"

volumes:
  staging_audio:
  staging_transcripts:
  staging_exports:
  staging_vector:
  staging_pgdata:
  staging_redis:
```

Deploy:
```bash
# Set environment variables
export STAGING_API_KEY="your-staging-key"
export HF_TOKEN="your-hf-token"
export NINE_ROUTER_KEY="your-9router-key"
export POSTGRES_PASSWORD="secure-password"

docker-compose -f docker-compose.staging.yml up -d --build

# Run migrations
docker-compose -f docker-compose.staging.yml exec ai-service alembic upgrade head
```

---

## 3. Production Deployment

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (nginx/HAProxy)             │
│                              │                                   │
│              ┌─────────────────┼─────────────────┐               │
│              ▼                 ▼                 ▼               │
│         ┌─────────┐      ┌─────────┐      ┌─────────┐           │
│         │ AI Pod 1│      │ AI Pod 2│      │ AI Pod 3│           │
│         │ (GPU)   │      │ (GPU)   │      │ (CPU)   │           │
│         └────┬────┘      └────┬────┘      └────┬────┘           │
│              │                │                │                │
│              └────────────────┼────────────────┘                │
│                               ▼                                 │
│              ┌─────────────────────────────────┐                │
│              │      Shared Storage (NFS/EFS)  │                │
│              │ /data/audio  /data/exports      │                │
│              │ /data/vector_db                 │                │
│              └─────────────────────────────────┘                │
│                               │                                 │
│              ┌────────────────┼────────────────┐                │
│              ▼                ▼                ▼                │
│         ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│         │ PostgreSQL│    │   Redis   │    │  NFS/EFS │          │
│         │  Cluster  │    │  Cluster  │    │  Storage │          │
│         └──────────┘    └──────────┘    └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Kubernetes Deployment

```yaml
# k8s/ai-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
  namespace: risalah
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: risalah/ai-service:v1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: RISALAH_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: api-key
        - name: RISALAH_DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: database-url
        - name: RISALAH_HUGGINGFACE_TOKEN
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: hf-token
        - name: RISALAH_NINE_ROUTER_KEY
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: nine-router-key
        resources:
          requests:
            memory: "4Gi"
            cpu: "2000m"
            nvidia.com/gpu: 1
          limits:
            memory: "8Gi"
            cpu: "4000m"
            nvidia.com/gpu: 1
        volumeMounts:
        - name: data
          mountPath: /data
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: ai-service-data
---
apiVersion: v1
kind: Service
metadata:
  name: ai-service
  namespace: risalah
spec:
  selector:
    app: ai-service
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-service-hpa
  namespace: risalah
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Celery Workers (Kubernetes)

```yaml
# k8s/celery-workers.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
  namespace: risalah
spec:
  replicas: 4
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
      - name: worker
        image: risalah/ai-service:v1.0.0
        command: ["celery", "-A", "app.celery_app", "worker", "--loglevel=info", "-Q", "transcription,diarization,nlp,minutes,rag,export,cleanup"]
        env:
        - name: RISALAH_DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: database-url
        - name: RISALAH_HUGGINGFACE_TOKEN
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: hf-token
        resources:
          requests:
            memory: "4Gi"
            cpu: "2000m"
            nvidia.com/gpu: 1
          limits:
            memory: "8Gi"
            cpu: "4000m"
            nvidia.com/gpu: 1
        volumeMounts:
        - name: data
          mountPath: /data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: ai-service-data
```

### Celery Beat (Kubernetes)

```yaml
# k8s/celery-beat.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-beat
  namespace: risalah
spec:
  replicas: 1
  selector:
    matchLabels:
      app: celery-beat
  template:
    metadata:
      labels:
        app: celery-beat
    spec:
      containers:
      - name: beat
        image: risalah/ai-service:v1.0.0
        command: ["celery", "-A", "app.celery_app", "beat", "--loglevel=info"]
        env:
        - name: RISALAH_DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### Ingress (nginx)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-service-ingress
  namespace: risalah
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "500m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
spec:
  ingressClassName: nginx
  rules:
  - host: ai-service.risalah.internal
    http:
      paths:
      - path: /api/v1
        pathType: Prefix
        backend:
          service:
            name: ai-service
            port:
              number: 8000
      - path: /docs
        pathType: Prefix
        backend:
          service:
            name: ai-service
            port:
              number: 8000
      - path: /openapi.json
        pathType: Prefix
        backend:
          service:
            name: ai-service
            port:
              number: 8000
  tls:
  - hosts:
    - ai-service.risalah.internal
    secretName: ai-service-tls
```

### Secrets

```bash
# Create secrets
kubectl create secret generic ai-service-secrets \
  --namespace=risalah \
  --from-literal=api-key="your-production-api-key" \
  --from-literal=database-url="postgresql+asyncpg://user:pass@postgres:5432/risalah" \
  --from-literal=hf-token="hf_xxxxxxxxxxxxxxxxx" \
  --from-literal=nine-router-key="your-9router-key"

# TLS certificate
kubectl create secret tls ai-service-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  --namespace=risalah
```

---

## 4. Persistent Storage

### NFS Provisioner (Example)

```yaml
# nfs-storage.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: ai-service-data-pv
spec:
  capacity:
    storage: 200Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  nfs:
    server: nfs-server.internal
    path: /exports/ai-service
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ai-service-data
  namespace: risalah
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 200Gi
  volumeName: ai-service-data-pv
```

### Directory Structure on NFS

```
/exports/ai-service/
├── audio/              # Uploaded audio files
├── transcripts/        # Temporary transcript files
├── exports/            # Generated DOCX files
└── vector_db/          # ChromaDB persistent storage
```

---

## 5. Monitoring & Logging

### Prometheus Metrics

```python
# Add to main.py
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

```yaml
# prometheus-rules.yaml
groups:
- name: ai-service
  rules:
  - alert: HighTranscriptionLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{handler="/api/v1/transcription/transcribe"}[5m])) > 30
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High transcription latency"
      
  - alert: CeleryQueueBacklog
    expr: celery_queue_length > 50
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Celery queue backlog detected"
      
  - alert: GPUOutOfMemory
    expr: nvidia_gpu_memory_used_bytes / nvidia_gpu_memory_total_bytes > 0.95
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "GPU OOM risk"
```

### Grafana Dashboard

Key panels to include:
- Request rate by endpoint
- Latency percentiles (p50, p95, p99)
- Error rate by endpoint
- Celery queue depths
- Worker CPU/Memory/GPU utilization
- Database connection pool
- Redis memory usage

### Structured Logging

```python
# Logging format (JSON)
{
  "timestamp": "2024-07-11T10:30:00Z",
  "level": "INFO",
  "logger": "app.services.whisperx_stt",
  "message": "Transcription completed",
  "meeting_id": "abc123",
  "duration_ms": 45000,
  "audio_duration_sec": 1800,
  "model": "large-v3",
  "device": "cuda"
}
```

---

## 6. Backup & Disaster Recovery

### Database Backup

```bash
# Daily cron
0 2 * * * pg_dump -h postgres -U risalah risalah | gzip > /backups/risalah_$(date +\%Y\%m\%d).sql.gz

# Retention: keep 30 days
find /backups -name "risalah_*.sql.gz" -mtime +30 -delete
```

### Volume Backup

```bash
# Weekly volume snapshot (if using cloud provider)
# AWS EBS: Create snapshot
# GCP: Create disk snapshot
# Azure: Create disk snapshot
```

### Restore Procedure

```bash
# 1. Restore database
gunzip -c /backups/risalah_20240711.sql.gz | psql -h postgres -U risalah risalah

# 2. Restore volumes from snapshot
# Attach restored volumes to new pods

# 3. Run migrations (if schema changed)
alembic upgrade head

# 4. Verify
curl http://localhost:8000/api/v1/health
```

---

## 7. Security Hardening

### Network Policies

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-service-netpol
  namespace: risalah
spec:
  podSelector:
    matchLabels:
      app: ai-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to: []  # Allow external for model downloads, 9router API
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

### Secrets Management

```bash
# Use external secrets operator or Vault
# Example with External Secrets Operator:
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ai-service-secrets
  namespace: risalah
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: ai-service-secrets
  data:
  - secretKey: api-key
    remoteRef:
      key: risalah/production
      property: api_key
  - secretKey: database-url
    remoteRef:
      key: risalah/production
      property: database_url
  - secretKey: hf-token
    remoteRef:
      key: risalah/production
      property: hf_token
```

---

## 8. CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_DB: risalah_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: [5432:5432]
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: '3.10'
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        python -m spacy download id_core_news_sm
    - name: Run tests
      run: |
        alembic upgrade head
        pytest tests/ -v --tb=short

  build:
    needs: test
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    - name: Login to Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - name: Build and Push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Staging
      run: |
        # SSH to staging server and deploy
        ssh staging-server "cd /opt/risalah && docker-compose -f docker-compose.staging.yml pull && docker-compose -f docker-compose.staging.yml up -d"

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
    - name: Deploy to Production
      run: |
        # Deploy via ArgoCD, Flux, or kubectl
        kubectl set image deployment/ai-service ai-service=ghcr.io/org/ai-service:${{ github.sha }} -n risalah
```

---

## 9. Troubleshooting Checklist

### Common Issues

| Symptom | Check | Resolution |
|---------|-------|------------|
| Transcription slow | GPU usage | Enable GPU, use float16, reduce batch_size |
| Diarization fails | HF token | Verify HUGGINGFACE_TOKEN has PyAnnote access |
| Celery tasks stuck | Redis/Queue | Check Redis memory, worker logs |
| DB connection errors | Pool size | Increase pool_size in database.py |
| OOM on GPU | Model too large | Use smaller model (medium), int8 quantization |
| Audio upload fails | Size limit | Increase MAX_UPLOAD_SIZE, nginx client_max_body_size |
| ChromaDB errors | Permissions | Fix /data/vector_db ownership |

### Debug Commands

```bash
# Check service health
curl http://localhost:8000/api/v1/health

# View Celery worker status
celery -A app.celery_app inspect active
celery -A app.celery_app inspect stats

# Check Redis
redis-cli INFO memory
redis-cli LLEN celery

# Check database
psql -h postgres -U risalah -c "SELECT count(*) FROM meetings;"

# View GPU usage:
nvidia-smi

# Check logs
docker-compose logs -f ai-service
kubectl logs -n risalah -l app=ai-service --tail=100
```

---

## 10. Rollback Procedure

```bash
# Kubernetes
kubectl rollout undo deployment/ai-service -n risalah

# Docker Compose
docker-compose -f docker-compose.prod.yml pull ai-service:previous-tag
docker-compose -f docker-compose.prod.yml up -d

# Database rollback (if migration)
alembic downgrade -1
# Or restore from backup
gunzip -c /backups/risalah_20240710.sql.gz | psql -h postgres -U risalah risalah
```

---

*Deployment Guide v1.0.0 - Last Updated: 2024-07-11*