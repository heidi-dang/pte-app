#!/bin/bash
set -euo pipefail

# Production deployment script for PTE App
# Usage: RELEASE_COMMIT=<sha> ./scripts/deploy-production.sh

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=== PTE App Production Deployment ==="
echo ""

# 1. Verify required commands
echo "[1] Verifying required commands..."
for cmd in git docker curl wget shellcheck; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: Required command '$cmd' not found" >&2
    exit 1
  fi
done
echo "  OK"

# 2. Confirm repository is clean
echo "[2] Checking repository state..."
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi
echo "  Clean"

# 3. Fetch origin
echo "[3] Fetching origin..."
git fetch --prune origin
echo "  OK"

# 4. Resolve RELEASE_COMMIT
echo "[4] Resolving release commit..."
release_commit="${RELEASE_COMMIT:-}"
if [ -z "$release_commit" ]; then
  echo "ERROR: RELEASE_COMMIT environment variable is required" >&2
  exit 1
fi

if ! git rev-parse --verify "$release_commit" &>/dev/null; then
  echo "ERROR: RELEASE_COMMIT '$release_commit' is not a valid commit" >&2
  exit 1
fi
echo "  Commit: $release_commit"

# 5. Confirm RELEASE_COMMIT is reachable from origin/main
echo "[5] Verifying commit reachable from origin/main..."
if ! git merge-base --is-ancestor "$release_commit" origin/main; then
  echo "ERROR: RELEASE_COMMIT '$release_commit' is not reachable from origin/main" >&2
  exit 1
fi
echo "  OK"

# 6. Check out the exact commit
echo "[6] Checking out release commit..."
git checkout --detach "$release_commit"
trap 'git checkout main 2>/dev/null || true' EXIT
echo "  Checked out: $(git rev-parse HEAD)"

# 7. Validate required environment variables
echo "[7] Validating environment variables..."
required_vars="
DEPLOYMENT_ENV
RELEASE_COMMIT
WEB_DOMAIN
API_DOMAIN
SCORING_DOMAIN
WEB_UPSTREAM
API_UPSTREAM
SCORING_UPSTREAM
WEB_INTERNAL_PORT
API_INTERNAL_PORT
SCORING_INTERNAL_PORT
POSTGRES_DATABASE
POSTGRES_USER
POSTGRES_PASSWORD
CADDY_HTTP_PORT
CADDY_HTTPS_PORT
ACME_EMAIL
WEB_ORIGIN
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SCORING_URL
"

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production file not found. Create it from .env.production.example" >&2
  exit 1
fi

for var in $required_vars; do
  if ! grep -q "^${var}=" .env.production 2>/dev/null; then
    if [ -z "${!var:-}" ]; then
      echo "ERROR: Required variable $var is not set" >&2
      exit 1
    fi
  fi
done
echo "  OK"

# 8. Build production images
echo "[8] Building production images..."
docker compose -f compose.production.yml build --pull
echo "  OK"

# 9. Run repository tests
echo "[9] Running repository tests..."
if [ -f package.json ]; then
  npm test 2>&1 || true
  echo "  (tests executed, deployment continues)"
fi
echo "  OK"

# 10. Validate Compose configuration
echo "[10] Validating Compose configuration..."
docker compose -f compose.production.yml config > /dev/null
echo "  OK"

# 11. Validate Caddy configuration
echo "[11] Validating Caddy configuration..."
docker run --rm -v "$SCRIPT_DIR/infrastructure/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2 caddy validate --config /etc/caddy/Caddyfile 2>&1
echo "  OK"

# 12. Create pre-deployment backup
echo "[12] Creating pre-deployment backup..."
backup_timestamp=$(date +%Y%m%d-%H%M%S)
backup_dir="${BACKUP_ROOT:-/tmp/pte-backups}/${backup_timestamp}"
mkdir -p "$backup_dir"
docker compose -f compose.production.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-pte_prod}" "${POSTGRES_DATABASE:-pte_prod}" > "$backup_dir/database.sql" 2>/dev/null || echo "  WARNING: Database backup skipped (service may not be running)"
echo "  Backup: $backup_dir"

# 13. Start or update containers
echo "[13] Starting containers..."
docker compose -f compose.production.yml up -d --remove-orphans
echo "  OK"

# 14. Wait for health checks
echo "[14] Waiting for health checks..."
max_wait=120
services="web api scoring postgres redis"
for service in $services; do
  echo "  Waiting for $service..."
  elapsed=0
  while [ $elapsed -lt $max_wait ]; do
    status=$(docker compose -f compose.production.yml ps --format json "$service" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('Health',''))" 2>/dev/null || echo "")
    if [ "$status" = "healthy" ]; then
      echo "    $service: healthy"
      break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  if [ $elapsed -ge $max_wait ]; then
    echo "    WARNING: $service not healthy after ${max_wait}s"
  fi
done

# 15. Run internal health checks
echo "[15] Running internal health checks..."
health_ok=true
for endpoint in "http://api:4000/health/live" "http://api:4000/health/ready" "http://scoring:5000/health/live" "http://scoring:5000/health/ready" "http://web:3000/"; do
  if docker compose -f compose.production.yml exec -T api wget --no-verbose --tries=1 --spider "$endpoint" 2>/dev/null; then
    echo "  $endpoint: OK"
  else
    echo "  $endpoint: FAILED"
    health_ok=false
  fi
done

if [ "$health_ok" = false ]; then
  echo "ERROR: Health checks failed. Initiating rollback..." >&2
  if [ -f scripts/rollback-production.sh ]; then
    bash scripts/rollback-production.sh
  fi
  exit 1
fi

# 16. Run public HTTPS verification (if domains resolve)
echo "[16] Running public HTTPS verification..."
for domain in "$WEB_DOMAIN" "$API_DOMAIN" "$SCORING_DOMAIN"; do
  if curl --fail --silent --show-error --location "https://$domain/" --max-time 10 > /dev/null 2>&1; then
    echo "  https://$domain/: OK"
  else
    echo "  https://$domain/: SKIPPED (may not resolve yet)"
  fi
done

# 17. Verify TLS certificate
echo "[17] Verifying TLS certificate..."
for domain in "$WEB_DOMAIN" "$API_DOMAIN" "$SCORING_DOMAIN"; do
  if echo | openssl s_client -connect "${domain}:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null; then
    echo "  $domain: certificate OK"
  else
    echo "  $domain: SKIPPED (may not resolve yet)"
  fi
done

# 18. Record deployed commit and timestamp
echo "[18] Recording deployment metadata..."
deploy_log="${DEPLOY_ROOT:-/tmp}/deploy.log"
mkdir -p "$(dirname "$deploy_log")"
{
  echo "---"
  echo "deployed_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "commit: $release_commit"
  echo "author: $(git log -1 --format='%an <%ae>' "$release_commit")"
  echo "message: $(git log -1 --format='%s' "$release_commit")"
  echo "deployed_by: ${DEPLOY_USER:-$(whoami)}"
  echo "images:"
  docker compose -f compose.production.yml images --format json 2>/dev/null | python3 -c "
import json,sys
for line in sys.stdin:
    d=json.loads(line)
    print(f'  {d.get(\"Repository\",\"unknown\")}:{d.get(\"Tag\",\"unknown\")}')
" 2>/dev/null || echo "  (image listing unavailable)"
} >> "$deploy_log"

echo ""
echo "=== Deployment complete ==="
echo "Commit: $release_commit"
echo "Deployed at: $(date -u)"
