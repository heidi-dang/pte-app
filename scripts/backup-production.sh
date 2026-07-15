#!/bin/bash
set -euo pipefail

# Production backup script for PTE App
# Creates a timestamped backup of the PostgreSQL database and Redis data.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=== PTE App Production Backup ==="

backup_root="${BACKUP_ROOT:-/opt/pte-app/backups}"
backup_timestamp=$(date +%Y%m%d-%H%M%S)
backup_dir="${backup_root}/${backup_timestamp}"

mkdir -p "$backup_dir"

echo "Backup directory: $backup_dir"

# Load production environment
set -a
if [ -f .env.production ]; then
  source .env.production
fi
set +a

db_user="${POSTGRES_USER:-pte_prod}"
db_name="${POSTGRES_DATABASE:-pte_prod}"

# Database backup
echo "Backing up PostgreSQL database..."
if docker compose -f compose.production.yml exec -T postgres pg_dump -U "$db_user" "$db_name" > "${backup_dir}/database.sql" 2>/dev/null; then
  gzip "${backup_dir}/database.sql"
  db_size=$(du -h "${backup_dir}/database.sql.gz" | cut -f1)
  echo "  Database backup: ${backup_dir}/database.sql.gz (${db_size})"
else
  echo "  WARNING: Database backup failed (service may not be running)"
fi

# Redis backup
echo "Backing up Redis data..."
if docker compose -f compose.production.yml exec -T redis redis-cli SAVE > /dev/null 2>&1; then
  docker compose -f compose.production.yml cp redis:/data/dump.rdb "${backup_dir}/redis.rdb" 2>/dev/null && \
    echo "  Redis backup: ${backup_dir}/redis.rdb" || \
    echo "  WARNING: Redis backup copy failed"
else
  echo "  WARNING: Redis save failed (service may not be running)"
fi

# Cleanup old backups (keep last 30 days)
find "$backup_root" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true

echo ""
echo "Backup complete: ${backup_dir}"
