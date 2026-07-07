#!/bin/bash
set -euo pipefail

usage() {
  echo "Usage: $0 <backup-timestamp>"
  echo "Example: $0 20250101_120000"
  exit 1
}

[ $# -eq 1 ] || usage

TIMESTAMP="$1"
BACKUP_DIR="/data/backups/${TIMESTAMP}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error_exit() { log "ERROR: $*"; exit 1; }

[ -d "$BACKUP_DIR" ] || error_exit "Backup directory not found: ${BACKUP_DIR}"

log "Starting restore from ${TIMESTAMP}"

# PostgreSQL
PG_DUMP_FILE="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"
if [ -f "$PG_DUMP_FILE" ]; then
  log "Restoring PostgreSQL..."
  pg_isready -h "$PG_HOST" -U "$PG_USER" || error_exit "PostgreSQL not reachable"
  pg_restore -h "$PG_HOST" -U "$PG_USER" -d "$PG_DATABASE" \
    --clean --if-exists \
    <(gunzip -c "$PG_DUMP_FILE") || error_exit "PostgreSQL restore failed"
  log "PostgreSQL restored successfully"
else
  log "WARNING: PostgreSQL dump not found, skipping"
fi

# Redis
REDIS_DUMP_FILE="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"
if [ -f "$REDIS_DUMP_FILE" ]; then
  log "Restoring Redis..."
  redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" FLUSHALL
  redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" --pipe < "$REDIS_DUMP_FILE" \
    || error_exit "Redis restore failed"
  log "Redis restored successfully"
else
  log "WARNING: Redis dump not found, skipping"
fi

log "Restore completed successfully"
