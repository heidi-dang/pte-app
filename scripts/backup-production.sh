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
backup_file="${backup_dir}/database.sql"
if ! docker compose -f compose.production.yml exec -T postgres pg_dump -U "$db_user" "$db_name" > "$backup_file" 2>/dev/null; then
  echo "ERROR: Database backup failed" >&2
  rm -rf "$backup_dir"
  exit 1
fi

dump_size=$(wc -c < "$backup_file" 2>/dev/null || echo 0)
if [ "$dump_size" -lt 10 ]; then
  echo "ERROR: Database backup produced empty or near-empty file (${dump_size} bytes)" >&2
  rm -rf "$backup_dir"
  exit 1
fi

gzip "${backup_file}"
db_checksum=$(sha256sum "${backup_file}.gz" | cut -d' ' -f1)
db_size=$(du -h "${backup_file}.gz" | cut -f1)
echo "  Database backup: ${backup_file}.gz (${db_size})"
echo "  Checksum (SHA256): $db_checksum"

# Redis backup
echo "Backing up Redis data..."
if ! docker compose -f compose.production.yml exec -T redis redis-cli SAVE > /dev/null 2>&1; then
  echo "ERROR: Redis save failed" >&2
  rm -rf "$backup_dir"
  exit 1
fi

if ! docker compose -f compose.production.yml cp redis:/data/dump.rdb "${backup_dir}/redis.rdb" 2>/dev/null; then
  echo "ERROR: Redis backup copy failed" >&2
  rm -rf "$backup_dir"
  exit 1
fi

redis_checksum=$(sha256sum "${backup_dir}/redis.rdb" | cut -d' ' -f1)
redis_size=$(du -h "${backup_dir}/redis.rdb" | cut -f1)
echo "  Redis backup: ${backup_dir}/redis.rdb (${redis_size})"
echo "  Checksum (SHA256): $redis_checksum"

# Write backup metadata
cat > "${backup_dir}/backup-metadata.txt" << EOF
backup_timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
backup_dir: $backup_dir
database_dump: database.sql.gz
database_checksum: $db_checksum
redis_dump: redis.rdb
redis_checksum: $redis_checksum
EOF

# Cleanup old backups (keep last 30 days)
find "$backup_root" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true

echo ""
echo "Backup complete: ${backup_dir}"
