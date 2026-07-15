# Cloudflare DNS

## Overview

This directory contains the DNS provisioning script for production deployment.

## Prerequisites

- Cloudflare API token with `DNS:Edit` permission for `tnaprovider.com.au`
- Zone ID for `tnaprovider.com.au`
- VPS public IP address

## DNS Mode

Two modes are supported:

**Mode A — Direct VPS routing (default):**

Cloudflare proxied DNS → VPS public IP → Caddy → containers

**Mode B — Cloudflare Tunnel:**

Cloudflare Tunnel → cloudflared container → Caddy or configured internal services

Configure via `CLOUDFLARE_PROXIED`:

- `true` (default): proxied DNS records pointing to VPS IP
- `false`: DNS-only records pointing to Tunnel endpoint

## Usage

### Dry run (review changes before applying)

```bash
CLOUDFLARE_DRY_RUN=true \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  VPS_IP="..." \
  ./infrastructure/cloudflare/sync-dns.sh
```

### Apply DNS records

```bash
CLOUDFLARE_DRY_RUN=false \
  CLOUDFLARE_API_TOKEN="..." \
  CLOUDFLARE_ZONE_ID="..." \
  VPS_IP="..." \
  ./infrastructure/cloudflare/sync-dns.sh
```

## Records managed

| Hostname                   | Type | Purpose         |
| -------------------------- | ---- | --------------- |
| pte.tnaprovider.com.au     | A    | Web application |
| api.tnaprovider.com.au     | A    | API service     |
| scoring.tnaprovider.com.au | A    | Scoring service |

## Rollback

Rollback data is saved to `/tmp/cloudflare-dns-rollback-*.json` after each apply.

To restore previous values, use the Cloudflare API or dashboard with the saved record IDs and content values.
