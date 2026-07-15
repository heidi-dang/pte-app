#!/bin/bash
set -euo pipefail

# Cloudflare DNS sync script for pte.tnaprovider.com.au
# Usage:
#   CLOUDFLARE_DRY_RUN=true ./infrastructure/cloudflare/sync-dns.sh
#   CLOUDFLARE_DRY_RUN=false ./infrastructure/cloudflare/sync-dns.sh

dry_run="${CLOUDFLARE_DRY_RUN:-true}"
api_token="${CLOUDFLARE_API_TOKEN:-}"
zone_id="${CLOUDFLARE_ZONE_ID:-}"
vps_ip="${VPS_IP:-}"
proxy_mode="${CLOUDFLARE_PROXIED:-true}"
ttl="${CLOUDFLARE_TTL:-120}"
rollback_file="${CLOUDFLARE_ROLLBACK_FILE:-/tmp/cloudflare-dns-rollback-$(date +%s).json}"

missing=""
if [ -z "$api_token" ]; then missing="$missing CLOUDFLARE_API_TOKEN"; fi
if [ -z "$zone_id" ]; then missing="$missing CLOUDFLARE_ZONE_ID"; fi
if [ -z "$vps_ip" ]; then missing="$missing VPS_IP"; fi

if [ -n "$missing" ]; then
  echo "ERROR: Missing required environment variables:$missing" >&2
  exit 1
fi

base_url="https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records"

records=(
  "pte.tnaprovider.com.au:A"
  "api.tnaprovider.com.au:A"
  "scoring.tnaprovider.com.au:A"
)

declare -A existing
declare -A existing_ids
declare -A rollback_data

echo "=== Cloudflare DNS Sync ==="
echo "Zone ID: ${zone_id:0:8}..."
echo "VPS IP: $vps_ip"
echo "Proxied: $proxy_mode"
echo "TTL: $ttl"
echo "Dry run: $dry_run"
echo ""

echo "=== Reading existing records ==="
for entry in "${records[@]}"; do
  name="${entry%%:*}"
  type="${entry##*:}"
  response=$(curl -s -X GET "$base_url?name=${name}&type=${type}" \
    -H "Authorization: Bearer $api_token" \
    -H "Content-Type: application/json")
  success=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")
  if [ "$success" != "True" ]; then
    err_msg=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('errors',[{}])[0].get('message','unknown'))" 2>/dev/null || echo "unknown error")
    echo "ERROR: Failed to read records for $name: $err_msg" >&2
    exit 1
  fi
  count=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('result_info',{}).get('total_count',0))" 2>/dev/null || echo "0")
  if [ "$count" -gt 0 ]; then
    record_id=$(echo "$response" | python3 -c "import json,sys; r=json.load(sys.stdin)['result'][0]; print(r['id'])" 2>/dev/null || echo "")
    record_content=$(echo "$response" | python3 -c "import json,sys; r=json.load(sys.stdin)['result'][0]; print(r['content'])" 2>/dev/null || echo "")
    record_proxied=$(echo "$response" | python3 -c "import json,sys; r=json.load(sys.stdin)['result'][0]; print(r['proxied'])" 2>/dev/null || echo "")
    existing[$name]="$record_content"
    existing_ids[$name]="$record_id"
    rollback_data[$name]=$(python3 -c "import json; print(json.dumps({'id':'$record_id','content':'$record_content','proxied':$record_proxied}))" 2>/dev/null || echo '{}')
    echo "  $name ($type): $record_content (proxied: $record_proxied, id: ${record_id:0:8}...)"
  else
    echo "  $name ($type): (not found)"
  fi
done

echo ""
echo "=== Change Plan ==="
for entry in "${records[@]}"; do
  name="${entry%%:*}"
  type="${entry##*:}"
  need_proxied="$proxy_mode"
  if [ "$need_proxied" = "true" ] || [ "$need_proxied" = "1" ]; then
    need_proxied="true"
  else
    need_proxied="false"
  fi
  if [ -n "${existing[$name]:-}" ]; then
    current_content="${existing[$name]}"
    if [ "$current_content" = "$vps_ip" ]; then
      echo "  $name ($type): No change needed (already $vps_ip)"
    else
      echo "  $name ($type): UPDATE ${current_content} → $vps_ip (proxied: $need_proxied)"
    fi
  else
    echo "  $name ($type): CREATE → $vps_ip (proxied: $need_proxied)"
  fi
done

if [ "$dry_run" = "true" ]; then
  echo ""
  echo "Dry run mode. No changes applied."
  echo "Set CLOUDFLARE_DRY_RUN=false to apply."
  exit 0
fi

echo ""
echo "=== Applying Changes ==="
for entry in "${records[@]}"; do
  name="${entry%%:*}"
  type="${entry##*:}"
  need_proxied="$proxy_mode"
  if [ "$need_proxied" = "true" ] || [ "$need_proxied" = "1" ]; then
    need_proxied="true"
  else
    need_proxied="false"
  fi
  if [ -n "${existing_ids[$name]:-}" ]; then
    current_content="${existing[$name]}"
    if [ "$current_content" = "$vps_ip" ]; then
      echo "  $name ($type): No update needed"
      continue
    fi
    record_id="${existing_ids[$name]}"
    response=$(curl -s -X PUT "$base_url/$record_id" \
      -H "Authorization: Bearer $api_token" \
      -H "Content-Type: application/json" \
      -d "$(cat <<EOF
{
  "type": "$type",
  "name": "$name",
  "content": "$vps_ip",
  "ttl": $ttl,
  "proxied": $need_proxied
}
EOF
)")
    success=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")
    if [ "$success" = "True" ]; then
      echo "  $name ($type): Updated → $vps_ip"
    else
      err_msg=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('errors',[{}])[0].get('message','unknown'))" 2>/dev/null || echo "unknown error")
      echo "ERROR: Failed to update $name: $err_msg" >&2
      exit 1
    fi
  else
    response=$(curl -s -X POST "$base_url" \
      -H "Authorization: Bearer $api_token" \
      -H "Content-Type: application/json" \
      -d "$(cat <<EOF
{
  "type": "$type",
  "name": "$name",
  "content": "$vps_ip",
  "ttl": $ttl,
  "proxied": $need_proxied
}
EOF
)")
    success=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")
    if [ "$success" = "True" ]; then
      result_id=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['id'])" 2>/dev/null || echo "")
      echo "  $name ($type): Created (id: ${result_id:0:8}...)"
    else
      err_msg=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('errors',[{}])[0].get('message','unknown'))" 2>/dev/null || echo "unknown error")
      echo "ERROR: Failed to create $name: $err_msg" >&2
      exit 1
    fi
  fi
done

echo ""
echo "=== Verification ==="
for entry in "${records[@]}"; do
  name="${entry%%:*}"
  type="${entry##*:}"
  response=$(curl -s -X GET "$base_url?name=${name}&type=${type}" \
    -H "Authorization: Bearer $api_token" \
    -H "Content-Type: application/json")
  content=$(echo "$response" | python3 -c "import json,sys; r=json.load(sys.stdin)['result']; print(r[0]['content'] if r else 'N/A')" 2>/dev/null || echo "N/A")
  proxied=$(echo "$response" | python3 -c "import json,sys; r=json.load(sys.stdin)['result']; print(r[0]['proxied'] if r else 'N/A')" 2>/dev/null || echo "N/A")
  echo "  $name ($type): $content (proxied: $proxied)"
done

echo ""
echo "=== Rollback data saved to $rollback_file ==="
python3 -c "
import json, os
data = {}
$(for key in "${!rollback_data[@]}"; do echo "data['$key'] = json.loads('''${rollback_data[$key]}''')"; done)
with open('$rollback_file', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null || true
echo "DNS sync complete."
