# Prompts — Phase 10 Architecture

## Mendesain Arsitektur
```
Bantu mendesain arsitektur untuk aplikasi AI Notulen Pemerintahan.

Tech stack: FastAPI, PostgreSQL, Redis, MinIO, Whisper, Pyannote,
Next.js, Docker, Kubernetes.

Gunakan C4 Model:
1. Context Diagram — user, admin, eksternal system
2. Container Diagram — web app, API, worker, DB, queue, storage
3. Component Diagram — per container (auth, upload, pipeline)
4. Deployment Diagram — k8s cluster, GPU node, storage
5. AI Pipeline — audio → VAD → split → transcribe → diarize → NLP
6. Sequence Diagram — upload → process → notify

Gunakan format PlantUML atau Mermaid.
```
