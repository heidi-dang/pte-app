#!/bin/bash
set -euo pipefail

# Production rollback script for PTE App
# Usage: ROLLBACK_COMMIT=<sha> ./scripts/rollback-production.sh
# If ROLLBACK_COMMIT is not specified, reads the previous commit from the deploy log.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

DEPLOY_LOG="${DEPLOY_ROOT:-/tmp}/deploy.log"
HEALTH_MAX_RETRIES="${HEALTH_MAX_RETRIES:-30}"
HEALTH_RETRY_DELAY="${HEALTH_RETRY_DELAY:-2}"

echo "=== PTE App Production Rollback ==="
echo ""

# Determine rollback target
rollback_commit="${ROLLBACK_COMMIT:-}"

if [ -z "$rollback_commit" ]; then
  if [ -f "$DEPLOY_LOG" ]; then
    prev_commit=$(grep "commit:" "$DEPLOY_LOG" | tail -2 | head -1 | awk '{print $2}' || echo "")
    if [ -n "$prev_commit" ]; then
      rollback_commit="$prev_commit"
      echo "Using previous commit from deploy log: $rollback_commit"
    fi
  fi
fi

if [ -z "$rollback_commit" ]; then
  echo "ERROR: No ROLLBACK_COMMIT specified and no previous commit found in deploy log" >&2
  exit 1
fi

echo "Target commit for rollback: $rollback_commit"

# Verify the commit exists and is reachable
if ! git rev-parse --verify "$rollback_commit" &>/dev/null; then
  echo "ERROR: Commit '$rollback_commit' is not a valid commit" >&2
  exit 1
fi

if ! git merge-base --is-ancestor "$rollback_commit" origin/main; then
  echo "ERROR: Rollback commit '$rollback_commit' is not reachable from origin/main" >&2
  exit 1
fi

# Create a backup of current database before rolling back
echo "Creating pre-rollback backup..."
backup_timestamp=$(date +%Y%m%d-%H%M%S)
backup_dir="${BACKUP_ROOT:-/tmp/pte-backups}/pre-rollback-${backup_timestamp}"
mkdir -p "$backup_dir"

if docker inspect --format '{{.State.Status}}' pte-prod-postgres 2>/dev/null | grep -q "running"; then
  db_user="${POSTGRES_USER:-pte_prod}"
  db_name="${POSTGRES_DATABASE:-pte_prod}"
  if ! docker compose -f compose.production.yml exec -T postgres pg_dump -U "$db_user" "$db_name" > "${backup_dir}/database.sql" 2>/dev/null; then
    echo "ERROR: Pre-rollback database backup failed" >&2
    exit 1
  fi
  gzip "${backup_dir}/database.sql"
  backup_checksum=$(sha256sum "${backup_dir}/database.sql.gz" | cut -d' ' -f1)
  echo "  Pre-rollback backup saved to $backup_dir (checksum: $backup_checksum)"
else
  echo "  No running database found. Skipping pre-rollback backup."
fi

# Set RELEASE_COMMIT and run deploy
export RELEASE_COMMIT="$rollback_commit"
echo "Rolling back to $rollback_commit..."

if ! bash scripts/deploy-production.sh; then
  echo "ERROR: Rollback deployment failed" >&2
  exit 1
fi

# Wait for all services and verify health
echo ""
echo "Verifying rollback health..."
rollback_ok=true
for service in postgres redis api scoring web worker caddy; do
  container_name="pte-prod-${service}"
  attempt=1
  while [ $attempt -le $HEALTH_MAX_RETRIES ]; do
    health_status=$(docker inspect --format '{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "not_found")
    if [ "$health_status" = "healthy" ]; then
      echo "  [health] $service attempt $attempt/$HEALTH_MAX_RETRIES: healthy"
      break
    fi
    echo "  [health] $service attempt $attempt/$HEALTH_MAX_RETRIES: ${health_status:-unhealthy}"
    sleep "$HEALTH_RETRY_DELAY"
    attempt=$((attempt + 1))
  done
  if [ "$attempt" -gt "$HEALTH_MAX_RETRIES" ]; then
    echo "  ERROR: $service not healthy after rollback" >&2
    rollback_ok=false
  fi
done

if [ "$rollback_ok" = false ]; then
  echo "ERROR: Rollback completed but service health checks failed" >&2
  exit 1
fi

echo ""
echo "=== Rollback complete ==="
echo "Rolled back to: $rollback_commit"
echo "Pre-rollback backup: $backup_dir"
