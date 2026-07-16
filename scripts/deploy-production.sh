#!/bin/bash
set -euo pipefail

# Production deployment script for PTE App
# Usage: RELEASE_COMMIT=<sha> ./scripts/deploy-production.sh

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

DEPLOY_LOG="${DEPLOY_ROOT:-/tmp}/deploy.log"
HEALTH_MAX_RETRIES="${HEALTH_MAX_RETRIES:-30}"
HEALTH_RETRY_DELAY="${HEALTH_RETRY_DELAY:-2}"

echo "=== PTE App Production Deployment ==="
echo ""

# 1. Verify required commands
echo "[1] Verifying required commands..."
for cmd in git docker curl openssl sha256sum python3; do
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

# 6. Check out the exact commit and verify
echo "[6] Checking out release commit..."
original_ref="$(git symbolic-ref --quiet --short HEAD || git rev-parse HEAD)"
deployment_succeeded=false

cleanup() {
  if [ "$deployment_succeeded" != true ]; then
    echo "  Restoring original ref ($original_ref)..."
    git checkout "$original_ref" 2>/dev/null || true
    if [ -d "$INFRA_BACKUP_DIR" ]; then
      for f in $INFRA_FILES; do
        if [ -f "$INFRA_BACKUP_DIR/$f" ]; then
          mkdir -p "$(dirname "$f")"
          cp "$INFRA_BACKUP_DIR/$f" "$f"
        fi
      done
      rm -rf "$INFRA_BACKUP_DIR"
    fi
  fi
}

trap cleanup EXIT

INFRA_FILES="compose.production.yml infrastructure/caddy/Caddyfile secrets/origin.pem secrets/origin-key.pem"
INFRA_BACKUP_DIR=""
for f in $INFRA_FILES; do
  if [ -f "$f" ]; then
    if [ -z "$INFRA_BACKUP_DIR" ]; then
      INFRA_BACKUP_DIR="/tmp/pte-infra-$$"
      rm -rf "$INFRA_BACKUP_DIR"
    fi
    mkdir -p "$(dirname "$INFRA_BACKUP_DIR/$f")"
    cp "$f" "$INFRA_BACKUP_DIR/$f"
  fi
done
if [ -n "$INFRA_BACKUP_DIR" ]; then
  echo "  Infra files backed up to $INFRA_BACKUP_DIR"
fi

release_commit_full=$(git rev-parse "$release_commit")
git checkout --detach "$release_commit_full"
checked_out=$(git rev-parse HEAD)
if [ "$checked_out" != "$release_commit_full" ]; then
  echo "ERROR: Checked out commit $checked_out does not match RELEASE_COMMIT $release_commit" >&2
  exit 1
fi
echo "  Checked out: $checked_out"

if [ -d "$INFRA_BACKUP_DIR" ]; then
  for f in $INFRA_FILES; do
    if [ -f "$INFRA_BACKUP_DIR/$f" ]; then
      mkdir -p "$(dirname "$f")"
      cp "$INFRA_BACKUP_DIR/$f" "$f"
    fi
  done
  rm -rf "$INFRA_BACKUP_DIR"
  echo "  Infra files restored"
fi

# 7. Record previous state for rollback
echo "[7] Recording previous deployment state..."
prev_commit=""
prev_metadata=""
if [ -f "$DEPLOY_LOG" ]; then
  prev_commit=$(grep "commit:" "$DEPLOY_LOG" | tail -1 | awk '{print $2}' || echo "")
  echo "  Previous commit: ${prev_commit:-none}"
else
  echo "  No previous deployment log found"
fi

# 8. Validate environment variables
echo "[8] Validating environment variables..."
if [ ! -f .env.production ]; then
  echo "ERROR: .env.production file not found. Create it from .env.production.example" >&2
  exit 1
fi

set -a
source .env.production
set +a

RELEASE_COMMIT="$release_commit"

required_vars="
DEPLOYMENT_ENV
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

validation_failed=false
for var in $required_vars; do
  value="${!var:-}"
  if [ -z "$value" ]; then
    echo "  FAIL: $var is not set or empty"
    validation_failed=true
    continue
  fi
  case "$var" in
    *_PORT|CADDY_HTTP_PORT|CADDY_HTTPS_PORT)
      if ! [[ "$value" =~ ^[0-9]+$ ]]; then
        echo "  FAIL: $var must be numeric (got: $value)"
        validation_failed=true
      fi
      ;;
    *_DOMAIN|WEB_ORIGIN|NEXT_PUBLIC_API_URL|NEXT_PUBLIC_SCORING_URL)
      if ! [[ "$value" =~ ^[a-zA-Z0-9.:/-]+$ ]]; then
        echo "  FAIL: $var contains invalid characters (got: $value)"
        validation_failed=true
      fi
      ;;
    *_UPSTREAM)
      if ! [[ "$value" =~ ^[a-zA-Z0-9._-]+:[0-9]+$ ]]; then
        echo "  FAIL: $var must be service:port format (got: $value)"
        validation_failed=true
      fi
      ;;
    DEPLOYMENT_ENV)
      if [ "$value" != "production" ]; then
        echo "  FAIL: DEPLOYMENT_ENV must be 'production' (got: $value)"
        validation_failed=true
      fi
      ;;
  esac
done

verification_mode="${PUBLIC_VERIFICATION_MODE:-production}"
if [ "$DEPLOYMENT_ENV" = "production" ] && [ "$verification_mode" != "production" ]; then
  echo "  FAIL: PUBLIC_VERIFICATION_MODE must be 'production' (got: $verification_mode). Deferred mode is for Phase Y only."
  validation_failed=true
fi

if [ "$validation_failed" = true ]; then
  echo "ERROR: Environment validation failed" >&2
  exit 1
fi
echo "  OK"

# 9. Install dependencies and build
echo "[9] Installing dependencies..."
rm -rf node_modules
npm ci --include=dev || npm install --include=dev
echo "  OK"

echo "[10] Building..."
npm run build
echo "  OK"

# 11. Validate Compose configuration
echo "[11] Validating Compose configuration..."
docker compose -f compose.production.yml config > /dev/null
echo "  OK"

# 12. Validate Caddy configuration with full env vars
echo "[12] Validating Caddy configuration..."
docker run --rm \
  -e ACME_EMAIL="$ACME_EMAIL" \
  -e WEB_DOMAIN="$WEB_DOMAIN" \
  -e API_DOMAIN="$API_DOMAIN" \
  -e SCORING_DOMAIN="$SCORING_DOMAIN" \
  -e WEB_UPSTREAM="$WEB_UPSTREAM" \
  -e API_UPSTREAM="$API_UPSTREAM" \
  -e SCORING_UPSTREAM="$SCORING_UPSTREAM" \
  -e WEB_ORIGIN="$WEB_ORIGIN" \
  -v "$SCRIPT_DIR/infrastructure/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2 \
  caddy validate --config /etc/caddy/Caddyfile 2>&1

docker run --rm \
  -e ACME_EMAIL="$ACME_EMAIL" \
  -e WEB_DOMAIN="$WEB_DOMAIN" \
  -e API_DOMAIN="$API_DOMAIN" \
  -e SCORING_DOMAIN="$SCORING_DOMAIN" \
  -e WEB_UPSTREAM="$WEB_UPSTREAM" \
  -e API_UPSTREAM="$API_UPSTREAM" \
  -e SCORING_UPSTREAM="$SCORING_UPSTREAM" \
  -e WEB_ORIGIN="$WEB_ORIGIN" \
  -v "$SCRIPT_DIR/infrastructure/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2 \
  caddy adapt --config /etc/caddy/Caddyfile 2>&1 > /dev/null
echo "  OK"

# 13. Build production images
echo "[13] Building production images..."
docker compose -f compose.production.yml build --pull
echo "  OK"

# 14. Create pre-deployment backup
echo "[14] Creating pre-deployment backup..."
backup_timestamp=$(date +%Y%m%d-%H%M%S)
backup_dir="${BACKUP_ROOT:-/tmp/pte-backups}/${backup_timestamp}"
mkdir -p "$backup_dir"

db_running=false
db_container_status=$(docker inspect --format '{{.State.Status}}' pte-prod-postgres 2>/dev/null || echo "not_found")
if [ "$db_container_status" = "running" ]; then
  db_running=true
fi

backup_checksum="none"
if [ "$db_running" = true ]; then
  db_user="${POSTGRES_USER}"
  db_name="${POSTGRES_DATABASE}"
  backup_file="${backup_dir}/database.sql"
  echo "  Backing up database..."
  if ! docker compose -f compose.production.yml exec -T postgres pg_dump -U "$db_user" "$db_name" > "$backup_file"; then
    echo "ERROR: Database backup command failed" >&2
    rm -rf "$backup_dir"
    exit 1
  fi
  dump_size=$(wc -c < "$backup_file" 2>/dev/null || echo 0)
  if [ "$dump_size" -lt 10 ]; then
    echo "ERROR: Database backup produced empty or near-empty file (${dump_size} bytes)" >&2
    rm -rf "$backup_dir"
    exit 1
  fi
  gzip "$backup_file"
  backup_checksum=$(sha256sum "${backup_file}.gz" | cut -d' ' -f1)
  echo "  Database backup: ${backup_file}.gz ($(du -h "${backup_file}.gz" | cut -f1))"
  echo "  Checksum (SHA256): $backup_checksum"

  echo "  Backing up Redis..."
  if docker compose -f compose.production.yml exec -T redis redis-cli SAVE > /dev/null; then
    if ! docker compose -f compose.production.yml cp redis:/data/dump.rdb "${backup_dir}/redis.rdb"; then
      echo "ERROR: Redis backup copy failed" >&2
      rm -rf "$backup_dir"
      exit 1
    fi
  fi
else
  echo "  No running database found. Skipping backup (first deployment)."
  echo "FIRST_DEPLOYMENT=true" > "${backup_dir}/first-deployment.txt"
fi

# 15. Start or update containers
echo "[15] Starting containers..."
docker compose -f compose.production.yml up -d --remove-orphans
echo "  OK"

# 16. Wait for health checks with visible progress
echo "[16] Waiting for health checks..."
service_health_ok=true
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
    echo "  ERROR: $service not healthy after ${HEALTH_MAX_RETRIES} attempts" >&2
    service_health_ok=false
  fi
done

if [ "$service_health_ok" = false ]; then
  echo "ERROR: Service health checks failed. Initiating rollback..." >&2
  if [ -f scripts/rollback-production.sh ]; then
    bash scripts/rollback-production.sh
  fi
  exit 1
fi

# 17. Run internal health checks
echo "[17] Running internal health checks..."
health_ok=true
for endpoint in "http://api:4000/health/live" "http://api:4000/health/ready" "http://scoring:5000/health/live" "http://scoring:5000/health/ready"; do
  if docker compose -f compose.production.yml exec -T api node /app/healthcheck.mjs "$endpoint" 5000 200 3 1000; then
    echo "  $endpoint: OK"
  else
    echo "  $endpoint: FAILED"
    health_ok=false
  fi
done

if docker compose -f compose.production.yml exec -T worker node /app/services/worker/dist/check.js; then
  echo "  worker health: OK"
else
  echo "  worker health: FAILED"
  health_ok=false
fi

if [ "$health_ok" = false ]; then
  echo "ERROR: Internal health checks failed. Initiating rollback..." >&2
  if [ -f scripts/rollback-production.sh ]; then
    bash scripts/rollback-production.sh
  fi
  exit 1
fi

# 18. Run public HTTPS verification
echo "[18] Running public HTTPS verification..."
https_ok=true
for domain in "$WEB_DOMAIN" "$API_DOMAIN" "$SCORING_DOMAIN"; do
  if curl --fail --silent --show-error --location --max-time 10 "https://$domain/" > /dev/null 2>&1; then
    echo "  https://$domain/: OK"
  else
    echo "  https://$domain/: FAILED"
    https_ok=false
  fi
done
if [ "$https_ok" = false ]; then
  echo "ERROR: HTTPS verification failed." >&2
  if [ -f scripts/rollback-production.sh ]; then
    bash scripts/rollback-production.sh
  fi
  exit 1
fi

# 19. Verify TLS certificate
echo "[19] Verifying TLS certificate..."
tls_ok=true
for domain in "$WEB_DOMAIN" "$API_DOMAIN" "$SCORING_DOMAIN"; do
  if echo | timeout 10 openssl s_client -connect "${domain}:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null; then
    echo "  $domain: certificate OK"
  else
    echo "  $domain: FAILED"
    tls_ok=false
  fi
done
if [ "$tls_ok" = false ]; then
  echo "ERROR: TLS certificate verification failed." >&2
  if [ -f scripts/rollback-production.sh ]; then
    bash scripts/rollback-production.sh
  fi
  exit 1
fi

# 20. Record deployment metadata
echo "[20] Recording deployment metadata..."
mkdir -p "$(dirname "$DEPLOY_LOG")"
{
  echo "---"
  echo "deployed_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "commit: $release_commit"
  echo "author: $(git log -1 --format='%an <%ae>' "$release_commit")"
  echo "message: $(git log -1 --format='%s' "$release_commit")"
  echo "deployed_by: ${DEPLOY_USER:-$(whoami)}"
  echo "verification_mode: production"
  echo "backup_path: ${backup_dir}"
  echo "backup_checksum: ${backup_checksum:-none}"
  echo "previous_commit: ${prev_commit:-none}"
  echo "images:"
  image_output=$(docker compose -f compose.production.yml images --format json 2>/dev/null || echo "")
  if [ -z "$image_output" ]; then
    echo "  (image listing unavailable)"
    echo "metadata_warning: image listing was empty or failed"
  else
    echo "$image_output" | python3 -c "
import json, sys
raw = sys.stdin.read().strip()
if not raw:
    print('  (image listing unavailable)')
    sys.exit(0)
try:
    data = json.loads(raw)
    if isinstance(data, list):
        for d in data:
            repo = d.get('Repository', 'unknown')
            tag = d.get('Tag', 'unknown')
            print(f'  {repo}:{tag}')
    elif isinstance(data, dict):
        repo = data.get('Repository', 'unknown')
        tag = data.get('Tag', 'unknown')
        print(f'  {repo}:{tag}')
    else:
        print('  (unexpected image metadata format)')
except json.JSONDecodeError:
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
            repo = d.get('Repository', 'unknown')
            tag = d.get('Tag', 'unknown')
            print(f'  {repo}:{tag}')
        except json.JSONDecodeError:
            print(f'  (malformed image line: {line})')
            continue
" || {
    echo "  (image listing unavailable)"
    echo "metadata_warning: image metadata parsing failed"
  }
  fi
} >> "$DEPLOY_LOG"

echo ""
echo "=== Deployment complete ==="
echo "Commit: $release_commit"
echo "Backup: ${backup_dir}"
echo "Deployed at: $(date -u)"

deployment_succeeded=true
trap - EXIT
