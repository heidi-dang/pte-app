# DNS

## Managed Records

The Cloudflare DNS sync script manages exactly **three** records:

### DIRECT mode (A/AAAA records)

| Hostname                     | Type | Value  | Purpose         |
| ---------------------------- | ---- | ------ | --------------- |
| `pte.tnaprovider.com.au`     | A    | VPS IP | Web application |
| `api.tnaprovider.com.au`     | A    | VPS IP | API service     |
| `scoring.tnaprovider.com.au` | A    | VPS IP | Scoring service |

All records are Cloudflare proxied (orange cloud) by default.

### TUNNEL mode (CNAME records)

| Hostname                     | Type  | Value           | Purpose         |
| ---------------------------- | ----- | --------------- | --------------- |
| `pte.tnaprovider.com.au`     | CNAME | Tunnel hostname | Web application |
| `api.tnaprovider.com.au`     | CNAME | Tunnel hostname | API service     |
| `scoring.tnaprovider.com.au` | CNAME | Tunnel hostname | Scoring service |

### Mode selection

`DNS_MODE` must be set to `DIRECT` or `TUNNEL`. The two modes are mutually exclusive — only three records are created per run, not six.

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
- Preserves unrelated DNS records untouched

### Environment Variables

| Variable               | Description                                         | Required     |
| ---------------------- | --------------------------------------------------- | ------------ |
| `DNS_MODE`             | `DIRECT` or `TUNNEL`                                | Yes          |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (DNS:Edit)                     | Yes          |
| `CLOUDFLARE_ZONE_ID`   | Cloudflare zone ID for tnaprovider.com.au           | Yes          |
| `VPS_IP`               | Public IP of the VPS (DIRECT mode)                  | Yes (DIRECT) |
| `TUNNEL_HOSTNAME`      | Cloudflare Tunnel hostname (TUNNEL mode)            | Yes (TUNNEL) |
| `CLOUDFLARE_PROXIED`   | Whether to proxy through Cloudflare (default: true) | No           |
| `CLOUDFLARE_TTL`       | DNS record TTL in seconds (default: 120)            | No           |
| `CLOUDFLARE_DRY_RUN`   | Dry-run mode (default: true)                        | No           |

### Usage

```bash
# DIRECT mode — dry run
DNS_MODE=DIRECT \
  CLOUDFLARE_DRY_RUN=true \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  VPS_IP="..." \
  ./infrastructure/cloudflare/sync-dns.sh

# DIRECT mode — apply
DNS_MODE=DIRECT \
  CLOUDFLARE_DRY_RUN=false \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  VPS_IP="..." \
  ./infrastructure/cloudflare/sync-dns.sh

# TUNNEL mode — dry run
DNS_MODE=TUNNEL \
  CLOUDFLARE_DRY_RUN=true \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  TUNNEL_HOSTNAME="..." \
  ./infrastructure/cloudflare/sync-dns.sh

# TUNNEL mode — apply
DNS_MODE=TUNNEL \
  CLOUDFLARE_DRY_RUN=false \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  TUNNEL_HOSTNAME="..." \
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
