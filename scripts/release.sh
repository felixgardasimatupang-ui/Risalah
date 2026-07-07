#!/bin/bash
set -euo pipefail

# Risalah Release Script
# Usage: ./scripts/release.sh [staging|production|rollback]
# Requires: kubectl, docker, gh

APP_NAME="risalah"
NAMESPACE_APP="risalah-app"
NAMESPACE_AI="risalah-ai"
REGISTRY="ghcr.io/risalah-sekneg"

COMMIT_HASH=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

release_staging() {
  echo "=== Releasing to STAGING ==="
  echo "Branch: $BRANCH"
  echo "Commit: $COMMIT_HASH"

  # 1. Build images
  echo "[1/5] Building images..."
  docker build -t $REGISTRY/$APP_NAME-app:$COMMIT_HASH -t $REGISTRY/$APP_NAME-app:latest .
  docker build -t $REGISTRY/$APP_NAME-ai:$COMMIT_HASH -t $REGISTRY/$APP_NAME-ai:latest services/ai-service

  # 2. Push images
  echo "[2/5] Pushing images..."
  docker push $REGISTRY/$APP_NAME-app:$COMMIT_HASH
  docker push $REGISTRY/$APP_NAME-ai:$COMMIT_HASH
  docker push $REGISTRY/$APP_NAME-app:latest
  docker push $REGISTRY/$APP_NAME-ai:latest

  # 3. Deploy to staging
  echo "[3/5] Deploying to staging..."
  kubectl set image deployment/$APP_NAME-app \
    app=$REGISTRY/$APP_NAME-app:$COMMIT_HASH \
    --namespace=$NAMESPACE_APP --record

  kubectl set image deployment/$APP_NAME-ai \
    ai=$REGISTRY/$APP_NAME-ai:$COMMIT_HASH \
    --namespace=$NAMESPACE_AI --record

  # 4. Wait for rollout
  echo "[4/5] Waiting for rollout..."
  kubectl rollout status deployment/$APP_NAME-app -n $NAMESPACE_APP --timeout=5m
  kubectl rollout status deployment/$APP_NAME-ai -n $NAMESPACE_AI --timeout=5m

  # 5. Health check
  echo "[5/5] Running health checks..."
  STAGING_URL="https://staging.risalah.sekneg.go.id"
  HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/api/auth/me)

  if [ "$HEALTH" = "200" ]; then
    echo "✅ Staging deployment successful (HTTP $HEALTH)"
  else
    echo "❌ Staging health check failed (HTTP $HEALTH)"
    exit 1
  fi
}

release_production() {
  echo "=== Releasing to PRODUCTION ==="
  echo "Branch: $BRANCH"
  echo "Commit: $COMMIT_HASH"

  # Confirm with user
  echo ""
  echo "⚠️  You are about to deploy to PRODUCTION!"
  echo "   Commit: $COMMIT_HASH"
  echo "   Tag: $TIMESTAMP"
  echo ""
  read -p "   Type 'DEPLOY' to confirm: " CONFIRM

  if [ "$CONFIRM" != "DEPLOY" ]; then
    echo "❌ Deployment cancelled."
    exit 1
  fi

  # Create git tag
  echo "[1/6] Creating release tag..."
  git tag "release-$TIMESTAMP" $COMMIT_HASH
  git push origin "release-$TIMESTAMP"

  # 1. Build & push (reuse staging images or rebuild)
  echo "[2/6] Ensuring latest images..."
  docker pull $REGISTRY/$APP_NAME-app:$COMMIT_HASH || {
    docker build -t $REGISTRY/$APP_NAME-app:$COMMIT_HASH -t $REGISTRY/$APP_NAME-app:latest .
    docker push $REGISTRY/$APP_NAME-app:$COMMIT_HASH
    docker push $REGISTRY/$APP_NAME-app:latest
  }

  docker pull $REGISTRY/$APP_NAME-ai:$COMMIT_HASH || {
    docker build -t $REGISTRY/$APP_NAME-ai:$COMMIT_HASH -t $REGISTRY/$APP_NAME-ai:latest services/ai-service
    docker push $REGISTRY/$APP_NAME-ai:$COMMIT_HASH
    docker push $REGISTRY/$APP_NAME-ai:latest
  }

  # 3. Deploy to production (rolling update, maxUnavailable=0)
  echo "[3/6] Deploying to production..."
  kubectl set image deployment/$APP_NAME-app \
    app=$REGISTRY/$APP_NAME-app:$COMMIT_HASH \
    --namespace=$NAMESPACE_APP --record

  kubectl set image deployment/$APP_NAME-ai \
    ai=$REGISTRY/$APP_NAME-ai:$COMMIT_HASH \
    --namespace=$NAMESPACE_AI --record

  # 4. Monitor rollout
  echo "[4/6] Monitoring rollout..."
  kubectl rollout status deployment/$APP_NAME-app -n $NAMESPACE_APP --timeout=10m
  kubectl rollout status deployment/$APP_NAME-ai -n $NAMESPACE_AI --timeout=10m

  # 5. Health checks
  echo "[5/6] Running health checks..."
  sleep 10
  PROD_URL="https://app.risalah.sekneg.go.id"

  for i in 1 2 3; do
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $PROD_URL/api/auth/me)
    if [ "$HEALTH" = "200" ]; then
      echo "   Health check $i/3: OK"
    else
      echo "   Health check $i/3: FAILED (HTTP $HEALTH)"
      if [ $i -eq 3 ]; then
        echo "❌ Production health check failed after 3 attempts"
        echo "   Run rollback: ./scripts/release.sh rollback"
        exit 1
      fi
      sleep 5
    fi
  done

  # 6. Notify
  echo "[6/6] Release complete!"
  echo "✅ Production deployment successful"
  echo "   Release tag: release-$TIMESTAMP"
  echo "   Commit: $COMMIT_HASH"
}

rollback() {
  echo "=== Performing Rollback ==="
  NAMESPACE="${1:-risalah-app}"

  # Get previous revision
  PREV_REVISION=$(kubectl rollout history deployment/$APP_NAME-app -n $NAMESPACE | tail -2 | head -1 | awk '{print $1}')

  if [ -z "$PREV_REVISION" ]; then
    echo "❌ No previous revision found"
    exit 1
  fi

  echo "Rolling back to revision $PREV_REVISION..."

  kubectl rollout undo deployment/$APP_NAME-app -n $NAMESPACE --to-revision=$PREV_REVISION
  kubectl rollout status deployment/$APP_NAME-app -n $NAMESPACE --timeout=5m

  if [ "$NAMESPACE" = "risalah-app" ]; then
    kubectl rollout undo deployment/$APP_NAME-ai -n risalah-ai --to-revision=$PREV_REVISION
    kubectl rollout status deployment/$APP_NAME-ai -n risalah-ai --timeout=5m
  fi

  echo "✅ Rollback complete to revision $PREV_REVISION"
}

# Main
case "${1:-help}" in
  staging)
    release_staging
    ;;
  production)
    release_production
    ;;
  rollback)
    rollback "${2:-}"
    ;;
  *)
    echo "Usage: $0 [staging|production|rollback]"
    echo ""
    echo "Commands:"
    echo "  staging              Build, push, deploy to staging"
    echo "  production           Tag, deploy to production (with confirmation)"
    echo "  rollback [ns]        Rollback to previous revision"
    exit 1
    ;;
esac
