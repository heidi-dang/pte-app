# Production Deployment

## Architecture

```
Client
  → Cloudflare (proxied DNS / CDN)
  → VPS public ports 80 and 443
  → Caddy (HTTPS reverse proxy)
  → Edge Docker network (pte-edge)
  → web / api / scoring (on edge)
  → Private Docker network (pte-private)
  → postgres / redis (private only)
```

- Only Caddy exposes public HTTP/HTTPS ports.
- Application containers communicate through the edge network.
- Databases and internal services are not exposed publicly.
- Postgres and Redis reside on an isolated private network.

## Prerequisites

- Docker and Docker Compose installed on the VPS
- Git access to the repository
- Cloudflare API token with DNS:Edit permission
- ACME email for Let's Encrypt certificates

## Environment Configuration

1. Copy `.env.production.example` to `.env.production`
2. Fill in all required values:
   - `CLOUDFLARE_API_TOKEN` — scoped Cloudflare API token
   - `CLOUDFLARE_ZONE_ID` — Cloudflare zone ID for tnaprovider.com.au
   - `VPS_IP` — public IP address of the VPS
   - `POSTGRES_PASSWORD` — strong random password
   - `ACME_EMAIL` — email for Let's Encrypt certificate notifications
   - `PUBLIC_VERIFICATION_MODE` — `production` or `deferred`

## Deployment

```bash
# Deploy an approved commit
RELEASE_COMMIT=<commit-sha> ./scripts/deploy-production.sh
```

### Deployment steps

1. Verifies required commands and clean repository state
2. Fetches origin and resolves the release commit
3. Confirms the commit is reachable from origin/main
4. Checks out the exact commit and verifies match
5. Records previous deployment state for rollback
6. Loads and validates all required environment variables
7. Runs full repository test suite (must pass)
8. Validates Compose and Caddy configuration
9. Creates a mandatory pre-deployment database backup (with checksum)
10. Builds production Docker images from compiled artifacts
11. Starts or updates containers
12. Waits for health checks with visible progress
13. Runs internal health verification
14. Runs public HTTPS/TLS verification (unless deferred)
15. Records deployment metadata

### Verification mode

Set `PUBLIC_VERIFICATION_MODE` to control public endpoint checking:

- `production` (default) — HTTPS and TLS checks are mandatory; failure rolls back
- `deferred` — HTTPS and TLS checks are skipped (for pre-DNS staging)

The selected mode is recorded in deployment metadata.

## DNS

After services pass internal checks, apply DNS:

```bash
# Review changes (dry run)
DNS_MODE=DIRECT CLOUDFLARE_DRY_RUN=true ./infrastructure/cloudflare/sync-dns.sh

# Apply DNS records
DNS_MODE=DIRECT CLOUDFLARE_DRY_RUN=false ./infrastructure/cloudflare/sync-dns.sh
```

See `docs/deployment/dns.md` for full details.

## Verification

```bash
# Full verification
./scripts/verify-production.sh

# Specific checks
curl -I https://pte.tnaprovider.com.au/
curl -I https://api.tnaprovider.com.au/health/ready
curl -I https://scoring.tnaprovider.com.au/health/ready
```

## Health Endpoints

| Service | Liveness                         | Readiness       |
| ------- | -------------------------------- | --------------- |
| Web     | `/` (via Caddy)                  | —               |
| API     | `/health/live`                   | `/health/ready` |
| Scoring | `/health/live`                   | `/health/ready` |
| Worker  | Config check via `dist/check.js` | —               |

## Notable behaviours

- Standard Docker Compose replacement is **not** zero-downtime. A full parallel-release or blue/green strategy would be required for zero-downtime deployments.
- All public endpoint examples use the approved `tnaprovider.com.au` domains. Test environment examples use `.test.local` domains.
