#!/bin/bash
set -euo pipefail

# Production verification script for PTE App
# Verifies that all services are healthy and accessible.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=== PTE App Production Verification ==="
echo ""

source_env() {
  if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
  fi
}
source_env

failures=0

# 1. Container status
echo "[1] Container status..."
docker compose -f compose.production.yml ps
echo ""

# 2. Container health
echo "[2] Container health checks..."
for service in postgres redis api scoring web worker caddy; do
  container_name="pte-prod-${service}"
  health_status=$(docker inspect --format '{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "unknown")
  if [ "$health_status" = "healthy" ]; then
    echo "  $service: healthy"
  else
    echo "  $service: $health_status"
    failures=$((failures + 1))
  fi
done

# 3. Internal health endpoints
echo ""
echo "[3] Internal health endpoints..."
for endpoint in \
  "http://api:4000/health/live" \
  "http://api:4000/health/ready" \
  "http://scoring:5000/health/live" \
  "http://scoring:5000/health/ready" \
  "http://web:3000/"; do
  if docker compose -f compose.production.yml exec -T api node /app/healthcheck.mjs "$endpoint" 5000 200 3 1000; then
    echo "  $endpoint: OK"
  else
    echo "  $endpoint: FAILED"
    failures=$((failures + 1))
  fi
done

# 4. Worker health
echo ""
echo "[4] Worker health..."
if docker compose -f compose.production.yml exec -T worker node /app/services/worker/dist/check.js; then
  echo "  worker: OK"
else
  echo "  worker: FAILED"
  failures=$((failures + 1))
fi

# 5. Public HTTPS endpoints
echo ""
echo "[5] Public HTTPS endpoints..."
for entry in \
  "${WEB_DOMAIN:-pte.tnaprovider.com.au}:/" \
  "${API_DOMAIN:-api.tnaprovider.com.au}:/health/ready" \
  "${SCORING_DOMAIN:-scoring.tnaprovider.com.au}:/health/ready"; do
  domain="${entry%%:*}"
  path="${entry#*:}"
  if curl --fail --silent --show-error --location --max-time 10 "https://${domain}${path}" > /dev/null 2>&1; then
    echo "  https://${domain}${path}: OK"
  else
    echo "  https://${domain}${path}: UNREACHABLE (may not resolve)"
    failures=$((failures + 1))
  fi
done

# 6. HTTP to HTTPS redirect
echo ""
echo "[6] HTTP to HTTPS redirect..."
for domain in "${WEB_DOMAIN:-pte.tnaprovider.com.au}" "${API_DOMAIN:-api.tnaprovider.com.au}" "${SCORING_DOMAIN:-scoring.tnaprovider.com.au}"; do
  http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://$domain/" 2>/dev/null || echo "000")
  if [ "$http_status" = "301" ] || [ "$http_status" = "302" ] || [ "$http_status" = "308" ]; then
    echo "  http://$domain/: redirect ($http_status)"
  fi
done

# 7. TLS certificate
echo ""
echo "[7] TLS certificate check..."
for domain in "${WEB_DOMAIN:-pte.tnaprovider.com.au}" "${API_DOMAIN:-api.tnaprovider.com.au}" "${SCORING_DOMAIN:-scoring.tnaprovider.com.au}"; do
  if cert_info=$(echo | timeout 10 openssl s_client -connect "${domain}:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null); then
    echo "  $domain:"
    echo "$cert_info" | sed 's/^/    /'
  else
    echo "  $domain: certificate check skipped"
  fi
done

# 8. Logs check
echo ""
echo "[8] Recent logs (last 20 lines per service)..."
for service in postgres redis api scoring web worker caddy; do
  echo "  --- $service ---"
  docker compose -f compose.production.yml logs --tail=20 "$service" 2>/dev/null | sed 's/^/    /' || true
done

echo ""
if [ $failures -eq 0 ]; then
  echo "All checks passed."
else
  echo "$failures check(s) failed."
fi

exit $failures
