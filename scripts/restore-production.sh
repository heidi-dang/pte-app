#!/bin/bash
set -euo pipefail

# Production restore script for PTE App
# Usage: ./scripts/restore-production.sh <backup-directory>

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-directory>" >&2
  echo "Example: $0 /opt/pte-app/backups/20240101-120000" >&2
  exit 1
fi

backup_dir="$1"

if [ ! -d "$backup_dir" ]; then
  echo "ERROR: Backup directory not found: $backup_dir" >&2
  exit 1
fi

echo "=== PTE App Production Restore ==="
echo "Restoring from: $backup_dir"

set -a
if [ -f .env.production ]; then
  source .env.production
fi
set +a

db_user="${POSTGRES_USER:-pte_prod}"
db_name="${POSTGRES_DATABASE:-pte_prod}"

# Restore database
if [ -f "${backup_dir}/database.sql.gz" ]; then
  echo "Restoring PostgreSQL database..."
  gunzip -c "${backup_dir}/database.sql.gz" | docker compose -f compose.production.yml exec -T postgres psql -U "$db_user" -d "$db_name" > /dev/null 2>&1 && \
    echo "  Database restored from ${backup_dir}/database.sql.gz" || \
    echo "  WARNING: Database restore failed"
elif [ -f "${backup_dir}/database.sql" ]; then
  echo "Restoring PostgreSQL database..."
  docker compose -f compose.production.yml exec -T postgres psql -U "$db_user" -d "$db_name" < "${backup_dir}/database.sql" > /dev/null 2>&1 && \
    echo "  Database restored from ${backup_dir}/database.sql" || \
    echo "  WARNING: Database restore failed"
else
  echo "  No database backup found in $backup_dir"
fi

# Restore Redis
if [ -f "${backup_dir}/redis.rdb" ]; then
  echo "Restoring Redis data..."
  docker compose -f compose.production.yml cp "${backup_dir}/redis.rdb" redis:/data/dump.rdb 2>/dev/null || \
    echo "  WARNING: Redis restore copy failed"
  docker compose -f compose.production.yml exec redis redis-cli CONFIG SET dir /data 2>/dev/null || true
  docker compose -f compose.production.yml exec redis redis-cli DEBUG RELOAD 2>/dev/null && \
    echo "  Redis restored from ${backup_dir}/redis.rdb" || \
    echo "  WARNING: Redis reload failed (restart required)"
fi

echo ""
echo "Restore complete."
echo "It is recommended to restart the stack: docker compose -f compose.production.yml restart"
