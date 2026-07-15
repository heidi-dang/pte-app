# Cloudflare DNS

## Overview

This directory contains the DNS provisioning script for production deployment.

## DNS Mode

Two mutually exclusive modes are supported, selected via `DNS_MODE`:

**DIRECT mode** (three A records):
Cloudflare proxied DNS → VPS public IP → Caddy → containers

**TUNNEL mode** (three CNAME records):
Cloudflare Tunnel → cloudflared container → Caddy or configured internal services

Only one mode can be active at a time. The script creates exactly three records per run, not six.

## Prerequisites

- Cloudflare API token with `DNS:Edit` permission for `tnaprovider.com.au`
- Zone ID for `tnaprovider.com.au`
- VPS public IP address (DIRECT mode) or Tunnel hostname (TUNNEL mode)

## Usage

### Dry run (review changes before applying)

```bash
# DIRECT mode — dry run
DNS_MODE=DIRECT \
  CLOUDFLARE_DRY_RUN=true \
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
```

### Apply DNS records

```bash
# DIRECT mode — apply
DNS_MODE=DIRECT \
  CLOUDFLARE_DRY_RUN=false \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  VPS_IP="..." \
  ./infrastructure/cloudflare/sync-dns.sh

# TUNNEL mode — apply
DNS_MODE=TUNNEL \
  CLOUDFLARE_DRY_RUN=false \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  TUNNEL_HOSTNAME="..." \
  ./infrastructure/cloudflare/sync-dns.sh
```

## Records managed

### DIRECT mode (A/AAAA records)

| Hostname                   | Type | Purpose         |
| -------------------------- | ---- | --------------- |
| pte.tnaprovider.com.au     | A    | Web application |
| api.tnaprovider.com.au     | A    | API service     |
| scoring.tnaprovider.com.au | A    | Scoring service |

### TUNNEL mode (CNAME records)

| Hostname                   | Type  | Purpose         |
| -------------------------- | ----- | --------------- |
| pte.tnaprovider.com.au     | CNAME | Web application |
| api.tnaprovider.com.au     | CNAME | API service     |
| scoring.tnaprovider.com.au | CNAME | Scoring service |

## Rollback

Rollback data is saved to `/tmp/cloudflare-dns-rollback-*.json` after each apply.

To restore previous values, use the Cloudflare API or dashboard with the saved record IDs and content values.
