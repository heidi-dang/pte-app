# DNS

## Managed Records

| Hostname                   | Type | Value  | Purpose         |
| -------------------------- | ---- | ------ | --------------- |
| pte.tnaprovider.com.au     | A    | VPS IP | Web application |
| api.tnaprovider.com.au     | A    | VPS IP | API service     |
| scoring.tnaprovider.com.au | A    | VPS IP | Scoring service |

All records are Cloudflare proxied (orange cloud) by default.

## DNS Management Script

The Cloudflare DNS sync script at `infrastructure/cloudflare/sync-dns.sh` manages all production DNS records.

### Features

- Idempotent — re-running makes no unnecessary changes
- Reads existing records before modifying
- Updates existing matching records instead of creating duplicates
- Prints a redacted change plan before applying
- Supports dry-run mode
- Fails clearly on API errors
- Verifies resulting records after update
- Never prints the Cloudflare API token
- Records previous values for rollback

### Environment Variables

| Variable               | Description                                         | Required |
| ---------------------- | --------------------------------------------------- | -------- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (DNS:Edit)                     | Yes      |
| `CLOUDFLARE_ZONE_ID`   | Cloudflare zone ID for tnaprovider.com.au           | Yes      |
| `VPS_IP`               | Public IP of the VPS                                | Yes      |
| `CLOUDFLARE_PROXIED`   | Whether to proxy through Cloudflare (default: true) | No       |
| `CLOUDFLARE_TTL`       | DNS record TTL in seconds (default: 120)            | No       |
| `CLOUDFLARE_DRY_RUN`   | Dry-run mode (default: true)                        | No       |

### Usage

```bash
# Dry run (review changes)
CLOUDFLARE_DRY_RUN=true \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  VPS_IP="..." \
  ./infrastructure/cloudflare/sync-dns.sh

# Apply
CLOUDFLARE_DRY_RUN=false \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  VPS_IP="..." \
  ./infrastructure/cloudflare/sync-dns.sh
```

## DNS Resolution Verification

```bash
dig @1.1.1.1 pte.tnaprovider.com.au
dig @8.8.8.8 api.tnaprovider.com.au
dig scoring.tnaprovider.com.au
```

## TLS Certificates

Certificates are provisioned automatically by Caddy using Let's Encrypt.

Caddy stores certificates in the `caddydata` Docker volume.
