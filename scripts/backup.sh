#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/data/backups/${TIMESTAMP}"
RETENTION_DAYS=30
S3_BUCKET="s3://risalah-backups"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

error_exit() { log "ERROR: $*"; exit 1; }

mkdir -p "$BACKUP_DIR"

log "Starting backup at ${TIMESTAMP}"

# PostgreSQL
PG_DUMP_FILE="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"
log "Dumping PostgreSQL..."
pg_dump -h "$PG_HOST" -U "$PG_USER" -d "$PG_DATABASE" -F c | gzip > "$PG_DUMP_FILE" \
  || error_exit "PostgreSQL dump failed"
log "PostgreSQL backup: $(du -h "$PG_DUMP_FILE" | cut -f1)"

# WAL archiving
log "Archiving WAL..."
pg_archivewal -h "$PG_HOST" -U "$PG_USER" -d "$PG_DATABASE" "${BACKUP_DIR}/wal/" \
  || log "WARNING: WAL archiving failed (non-fatal)"

# Redis
REDIS_DUMP_FILE="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"
log "Saving Redis snapshot..."
redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" SAVE || log "WARNING: Redis save failed"
redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" --rdb "$REDIS_DUMP_FILE" \
  || error_exit "Redis dump failed"
log "Redis backup: $(du -h "$REDIS_DUMP_FILE" | cut -f1)"

# Application config
log "Backing up configuration..."
cp -r /app/.env "${BACKUP_DIR}/" 2>/dev/null || true
cp -r /app/k8s "${BACKUP_DIR}/k8s" 2>/dev/null || true

# Sync to object storage
log "Syncing to S3/MinIO..."
aws s3 sync "$BACKUP_DIR" "${S3_BUCKET}/${TIMESTAMP}/" \
  --storage-class STANDARD_IA || log "WARNING: S3 sync failed"

# Cleanup old backups
log "Cleaning backups older than ${RETENTION_DAYS} days..."
find /data/backups -type d -mtime +"$RETENTION_DAYS" -exec rm -rf {} +
aws s3 ls "${S3_BUCKET}/" | while read -r line; do
  DATE=$(echo "$line" | awk '{print $1}')
  if [[ $(date -d "$DATE" +%s) -lt $(date -d "-${RETENTION_DAYS} days" +%s) ]]; then
    PREFIX=$(echo "$line" | awk '{print $2}')
    aws s3 rm "${S3_BUCKET}/${PREFIX}" --recursive || true
  fi
done

log "Backup completed successfully at ${TIMESTAMP}"
