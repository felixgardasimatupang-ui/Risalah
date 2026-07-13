# Prompts — Phase 18 Deployment

## Setup Deployment
```
Bantu setup deployment untuk AI Notulen Pemerintahan.

Services:
- Frontend (Next.js)
- Backend API (FastAPI)
- AI Worker (Python)
- PostgreSQL
- Redis
- MinIO

Buat:
1. Dockerfile multi-stage untuk setiap service
2. Docker Compose untuk development
3. Kubernetes manifests (deployment, service, ingress, HPA)
4. GitHub Actions CI/CD (lint → test → build → deploy)
5. Nginx/Traefik config untuk reverse proxy
6. Let's Encrypt SSL certificates

GPU node configuration untuk AI inference.
```
