# Prompts — Phase 19 Monitoring

## Setup Monitoring
```
Bantu setup monitoring untuk AI Notulen Pemerintahan.

1. Prometheus:
   - Scrape metrics dari FastAPI, Celery, Node.js
   - Custom metrics: transcription latency, WER

2. Grafana:
   - Dashboard: System Overview
   - Dashboard: AI Pipeline Performance
   - Dashboard: Queue Status
   - Dashboard: GPU Utilization

3. Logging (Loki + Promtail):
   - Application logs
   - AI Pipeline logs
   - Error tracking

4. Alerting:
   - API error rate > 1%
   - Queue backlog > 100
   - GPU memory > 90%
   - Transcription latency > 10 menit
```
