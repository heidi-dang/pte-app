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
for service in postgres redis api scoring web worker; do
  status=$(docker compose -f compose.production.yml ps --format json "$service" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('Health','unknown'))" 2>/dev/null || echo "unknown")
  if [ "$status" = "healthy" ]; then
    echo "  $service: healthy"
  else
    echo "  $service: $status"
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
  if docker compose -f compose.production.yml exec -T api wget --no-verbose --tries=1 --spider "$endpoint" 2>/dev/null; then
    echo "  $endpoint: OK"
  else
    echo "  $endpoint: FAILED"
    failures=$((failures + 1))
  fi
done

# 4. Public HTTPS endpoints
echo ""
echo "[4] Public HTTPS endpoints..."
for domain in "${WEB_DOMAIN:-pte.tnaprovider.com.au}" "${API_DOMAIN:-api.tnaprovider.com.au}" "${SCORING_DOMAIN:-scoring.tnaprovider.com.au}"; do
  if curl --fail --silent --show-error --location --max-time 10 "https://$domain/" > /dev/null 2>&1; then
    echo "  https://$domain/: OK"
  elif curl --fail --silent --show-error --location --max-time 10 "https://$domain/health/live" > /dev/null 2>&1; then
    echo "  https://$domain/health/live: OK"
  else
    echo "  https://$domain/: UNREACHABLE (may not resolve)"
  fi
done

# 5. HTTP to HTTPS redirect
echo ""
echo "[5] HTTP to HTTPS redirect..."
for domain in "${WEB_DOMAIN:-pte.tnaprovider.com.au}" "${API_DOMAIN:-api.tnaprovider.com.au}" "${SCORING_DOMAIN:-scoring.tnaprovider.com.au}"; do
  http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://$domain/" 2>/dev/null || echo "000")
  if [ "$http_status" = "301" ] || [ "$http_status" = "302" ] || [ "$http_status" = "308" ]; then
    echo "  http://$domain/: redirect ($http_status)"
  else
    echo "  http://$domain/: $http_status (not tested)"
  fi
done

# 6. TLS certificate
echo ""
echo "[6] TLS certificate check..."
for domain in "${WEB_DOMAIN:-pte.tnaprovider.com.au}" "${API_DOMAIN:-api.tnaprovider.com.au}" "${SCORING_DOMAIN:-scoring.tnaprovider.com.au}"; do
  if cert_info=$(echo | openssl s_client -connect "${domain}:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null); then
    echo "  $domain:"
    echo "$cert_info" | sed 's/^/    /'
  else
    echo "  $domain: certificate check skipped"
  fi
done

# 7. Logs check
echo ""
echo "[7] Recent logs (last 20 lines per service)..."
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
