#!/bin/bash
set -euo pipefail

# Risalah Rollback Script
# Usage: ./scripts/rollback.sh [app|ai|all] [revision]
# Examples:
#   ./scripts/rollback.sh app         # Rollback app to previous revision
#   ./scripts/rollback.sh ai 3        # Rollback AI to revision 3
#   ./scripts/rollback.sh all         # Rollback both app + AI

NAMESPACE_APP="risalah-app"
NAMESPACE_AI="risalah-ai"

rollback_app() {
  local REVISION="${1:-}"
  local NS="$NAMESPACE_APP"

  echo "=== Rolling back risalah-app ==="

  if [ -n "$REVISION" ]; then
    echo "Target revision: $REVISION"
    kubectl rollout undo deployment/risalah-app -n $NS --to-revision=$REVISION
  else
    PREV=$(kubectl rollout history deployment/risalah-app -n $NS | tail -2 | head -1 | awk '{print $1}')
    echo "Previous revision: $PREV"
    kubectl rollout undo deployment/risalah-app -n $NS
  fi

  kubectl rollout status deployment/risalah-app -n $NS --timeout=5m
  echo "✅ risalah-app rollback complete"
}

rollback_ai() {
  local REVISION="${1:-}"
  local NS="$NAMESPACE_AI"

  echo "=== Rolling back risalah-ai ==="

  if [ -n "$REVISION" ]; then
    kubectl rollout undo deployment/risalah-ai -n $NS --to-revision=$REVISION
  else
    kubectl rollout undo deployment/risalah-ai -n $NS
  fi

  kubectl rollout status deployment/risalah-ai -n $NS --timeout=5m
  echo "✅ risalah-ai rollback complete"
}

# Check if deployment exists
check_deployment() {
  local NAME="$1"
  local NS="$2"
  kubectl get deployment "$NAME" -n "$NS" &>/dev/null || {
    echo "❌ Deployment $NAME not found in namespace $NS"
    exit 1
  }
}

case "${1:-help}" in
  app)
    check_deployment "risalah-app" "$NAMESPACE_APP"
    rollback_app "${2:-}"
    ;;
  ai)
    check_deployment "risalah-ai" "$NAMESPACE_AI"
    rollback_ai "${2:-}"
    ;;
  all)
    check_deployment "risalah-app" "$NAMESPACE_APP"
    check_deployment "risalah-ai" "$NAMESPACE_AI"
    rollback_app "${2:-}"
    rollback_ai "${2:-}"
    echo "✅ Full rollback complete"
    ;;
  *)
    echo "Usage: $0 [app|ai|all] [revision]"
    echo ""
    echo "Commands:"
    echo "  app [rev]      Rollback app to previous or specific revision"
    echo "  ai [rev]       Rollback AI service to previous or specific revision"
    echo "  all [rev]      Rollback both app and AI"
    echo ""
    echo "Examples:"
    echo "  $0 app          # Rollback app to previous revision"
    echo "  $0 ai 3         # Rollback AI to revision 3"
    echo "  $0 all          # Rollback both services"
    echo ""
    echo "View rollout history:"
    echo "  kubectl rollout history deployment/risalah-app -n risalah-app"
    echo "  kubectl rollout history deployment/risalah-ai -n risalah-ai"
    exit 1
    ;;
esac
