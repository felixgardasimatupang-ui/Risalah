# Release Process — Risalah SEKNEG AI

## Overview

```
Feature Branch  →  Staging  →  UAT  →  Production
    (PR)            (auto)     (manual)   (tagged)
```

The release pipeline has 4 environments, each with progressive validation gates.

---

## Environments

| Environment | URL | Purpose | Deploy Trigger | Rollout Strategy |
|-------------|-----|---------|----------------|-----------------|
| **Staging** | `https://staging.risalah.sekneg.go.id` | Integration testing, smoke tests | Push to `main` | Rolling update |
| **UAT** | `https://uat.risalah.sekneg.go.id` | User acceptance testing | Manual promotion | Rolling update |
| **Production** | `https://app.risalah.sekneg.go.id` | Live production | Manual promotion | Zero-downtime rolling update |

### Staging

- Deploys automatically on every push to `main`
- Uses Whisper `tiny` model (CPU, fast)
- 1 replica, reduced resources
- Staging database (reset periodically)
- All features enabled for testing

### UAT

- Manually promoted from staging
- Used by product team and stakeholders for final verification
- Same infrastructure spec as production
- UAT database (persistent, test data)

### Production

- Manually promoted from UAT
- Full GPU acceleration (Whisper large-v3)
- 3 app replicas, 2 AI replicas
- Production database with PITR backup
- Zero-downtime rolling updates (`maxUnavailable: 0`)
- Health checks before traffic switches

---

## Release Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/nama-fitur

# Develop, commit, push
git add .
git commit -m "feat: deskripsi fitur"
git push origin feature/nama-fitur
```

### 2. Pull Request

1. Open PR to `main` on GitHub
2. CI runs automatically: lint → typecheck → build → test
3. PR must pass all checks + get at least 1 review approval
4. Merge to `main`

### 3. Automatic Staging Deploy

Merging to `main` triggers:
1. **Test** — Lint + typecheck + build + unit tests
2. **Docker** — Build & push `risalah-app` and `risalah-ai` images
3. **Deploy Staging** — Rolling update on staging cluster
4. **Smoke Tests** — Health check + API smoke tests

### 4. UAT Promotion

After staging passes:

```bash
# Option A: GitHub UI
# Go to Actions → Deploy → Run workflow → uat

# Option B: Manual via kubectl
kubectl set image deployment/risalah-app \
  app=ghcr.io/risalah-sekneg/risalah-app:<commit-sha> \
  --namespace=risalah-app --record
kubectl rollout status deployment/risalah-app -n risalah-app --timeout=5m
```

### 5. Production Release

```bash
# Via GitHub UI:
# Go to Actions → Deploy → Run workflow → production

# Or via local script:
./scripts/release.sh production
```

The deployment script will:
1. Create a git tag: `release-YYYYMMDD-HHMMSS`
2. Run zero-downtime rolling update
3. Monitor rollout status (10 min timeout)
4. Run health checks (5 attempts)
5. Fail and suggest rollback if health checks fail

---

## Release Checklist

### Pre-Release

- [ ] All PRs merged and CI passing
- [ ] Staging smoke tests passed
- [ ] UAT approved by product owner
- [ ] Database migrations tested (no backward-incompatible changes)
- [ ] Backup completed
- [ ] Release notes prepared

### During Release

- [ ] Monitor Grafana dashboard for anomalies
- [ ] Watch rollout logs in CI
- [ ] Verify health check passes
- [ ] Check error rate (should not increase)

### Post-Release

- [ ] Verify critical flows: login, meetings, transcripts, chat
- [ ] Check AI pipeline processes correctly
- [ ] Monitor for 30 minutes post-release
- [ ] Notify stakeholders
- [ ] Tag release in GitHub

---

## Rollback

### When to Rollback

- Error rate spikes >5%
- Health check fails
- Critical feature broken
- Performance degradation >50% latency increase
- Database corruption detected

### How to Rollback

#### Immediate Rollback (kubectl)

```bash
# Rollback app to previous revision
kubectl rollout undo deployment/risalah-app -n risalah-app
kubectl rollout status deployment/risalah-app -n risalah-app --timeout=5m

# Rollback AI service
kubectl rollout undo deployment/risalah-ai -n risalah-ai
kubectl rollout status deployment/risalah-ai -n risalah-ai --timeout=5m
```

#### Rollback with Script

```bash
# Rollback both services
./scripts/rollback.sh all

# Rollback to specific revision
kubectl rollout history deployment/risalah-app -n risalah-app
./scripts/rollback.sh app 3
```

#### Database Rollback

If the release included database migrations:

```bash
# Check if migration was applied
kubectl exec deployment/risalah-app -n risalah-app -- npx prisma migrate status

# If rollback needed (last resort):
# Restore from backup
./scripts/restore.sh --db --latest
```

---

## Versioning

- **Release tag format:** `release-YYYYMMDD-HHMMSS`
- **Docker image tag:** Git commit SHA + `latest`
- **Database migration:** Sequential Prisma migration files
- **API version:** URL-prefixed (`/api/v1/`)

---

## Monitoring During Release

### Key Metrics to Watch

| Metric | Normal Range | Alert Threshold |
|--------|-------------|-----------------|
| HTTP 5xx rate | <1% | >5% |
| p95 latency | <500ms | >2s |
| Error rate | <0.5% | >3% |
| CPU usage | <70% | >85% |
| Memory usage | <80% | >90% |

### Dashboard Links

- **Application:** `https://grafana.risalah.sekneg.go.id/d/risalah-app`
- **AI Pipeline:** `https://grafana.risalah.sekneg.go.id/d/risalah-ai`
- **Database:** `https://grafana.risalah.sekneg.go.id/d/risalah-db`
- **Infrastructure:** `https://grafana.risalah.sekneg.go.id/d/risalah-infra`

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| DevOps Lead | devops@sekneg.go.id |
| Backend Lead | backend@sekneg.go.id |
| AI Lead | ai@sekneg.go.id |
| Product Manager | pm@sekneg.go.id |

For critical production incidents, use the `#risalah-incident` Slack channel.
