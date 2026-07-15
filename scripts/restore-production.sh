#!/bin/bash
set -euo pipefail

# Production restore script for PTE App
# Usage: ./scripts/restore-production.sh <backup-directory>

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

backup_dir=""
while [ $# -gt 0 ]; do
  case "$1" in
    --backup)
      backup_dir="$2"
      shift 2
      ;;
    -*)
      echo "Usage: $0 [--backup <backup-directory>] <backup-directory>" >&2
      echo "Example: $0 --backup /opt/pte-app/backups/20240101-120000" >&2
      exit 1
      ;;
    *)
      backup_dir="$1"
      shift
      ;;
  esac
done

if [ -z "$backup_dir" ]; then
  echo "Usage: $0 [--backup <backup-directory>] <backup-directory>" >&2
  echo "Example: $0 --backup /opt/pte-app/backups/20240101-120000" >&2
  exit 1
fi

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
  {
    echo "DROP SCHEMA public CASCADE;"
    echo "CREATE SCHEMA public;"
    gunzip -c "${backup_dir}/database.sql.gz"
  } | docker compose -f compose.production.yml exec -T postgres psql -U "$db_user" -d "$db_name" > /dev/null 2>&1
  echo "  Database restored from ${backup_dir}/database.sql.gz"
elif [ -f "${backup_dir}/database.sql" ]; then
  echo "Restoring PostgreSQL database..."
  {
    echo "DROP SCHEMA public CASCADE;"
    echo "CREATE SCHEMA public;"
    cat "${backup_dir}/database.sql"
  } | docker compose -f compose.production.yml exec -T postgres psql -U "$db_user" -d "$db_name" > /dev/null 2>&1
  echo "  Database restored from ${backup_dir}/database.sql"
else
  echo "  No database backup found in $backup_dir"
fi

# Restore Redis
if [ -f "${backup_dir}/redis.rdb" ]; then
  echo "Restoring Redis data..."
  if ! docker compose -f compose.production.yml stop redis 2>/dev/null; then
    echo "ERROR: Failed to stop Redis for restore" >&2
    exit 1
  fi
  if ! docker cp "${backup_dir}/redis.rdb" pte-prod-redis:/data/dump.rdb 2>/dev/null; then
    echo "ERROR: Redis restore copy failed" >&2
    docker compose -f compose.production.yml start redis > /dev/null 2>&1
    exit 1
  fi
  if ! docker compose -f compose.production.yml start redis 2>/dev/null; then
    echo "ERROR: Failed to start Redis after restore" >&2
    exit 1
  fi
  echo "  Redis restored from ${backup_dir}/redis.rdb"
fi

echo ""
echo "Restore complete."
