# Risalah SEKNEG AI — Documentation

Sistem Manajemen Rapat dan Notulen berbasis AI untuk Pemerintahan Indonesia.

## Architecture

| Document | Description |
|----------|-------------|
| [System Overview](architecture/OVERVIEW.md) | High-level architecture, tech stack, principles |
| [Database ERD](architecture/ERD.md) | Entity relation diagram, all tables, indexes |
| [API Blueprint](architecture/API.md) | Original API design specification |
| [Data Flow](architecture/DATA_FLOW.md) | Pipeline flows: upload, live, chat, export |
| [Infrastructure](architecture/INFRASTRUCTURE.md) | K8s, monitoring, backup strategy |

## API

| Document | Description |
|----------|-------------|
| [API Reference](api/API.md) | Complete API docs with request/response examples |

## Deployment

| Document | Description |
|----------|-------------|
| [Deployment Guide](deployment/README.md) | Dev setup, Docker, K8s, CI/CD, monitoring |

## User & Admin

| Document | Description |
|----------|-------------|
| [User Guide](user-guide.md) | End-user guide for all features |
| [Admin Guide](admin-guide.md) | Admin: RBAC, audit, security, monitoring, backup |

## Quick Links

| Resource | URL |
|----------|-----|
| Application | `http://localhost:3000` |
| AI Service API (Swagger) | `http://localhost:8000/docs` |
| Grafana | `http://localhost:3001` |
| MinIO Console | `http://localhost:9001` |
| Prometheus | `http://localhost:9090` |
