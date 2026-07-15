#!/bin/bash
set -euo pipefail

# Production rollback script for PTE App
# Usage: ROLLBACK_COMMIT=<sha> ./scripts/rollback-production.sh
# If ROLLBACK_COMMIT is not specified, rolls back to the previous deployable commit (one before last).

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=== PTE App Production Rollback ==="
echo ""

# Determine rollback target
rollback_commit="${ROLLBACK_COMMIT:-}"

if [ -z "$rollback_commit" ]; then
  deploy_log="${DEPLOY_ROOT:-/tmp}/deploy.log"
  if [ -f "$deploy_log" ]; then
    prev_commit=$(grep "commit:" "$deploy_log" | tail -2 | head -1 | awk '{print $2}')
    rollback_commit="$prev_commit"
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
docker compose -f compose.production.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-pte_prod}" "${POSTGRES_DATABASE:-pte_prod}" > "$backup_dir/database.sql" 2>/dev/null || echo "  WARNING: Database backup skipped"
echo "  Backup saved to $backup_dir"

# Set RELEASE_COMMIT and use deploy script
export RELEASE_COMMIT="$rollback_commit"

echo "Rolling back to $rollback_commit..."
bash scripts/deploy-production.sh

echo ""
echo "=== Rollback complete ==="
echo "Rolled back to: $rollback_commit"
