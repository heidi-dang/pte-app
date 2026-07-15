# Production Deployment

## Architecture

```
Client
  → Cloudflare (proxied DNS / CDN)
  → VPS public ports 80 and 443
  → Caddy (HTTPS reverse proxy)
  → Private Docker network (pte-production)
  → web / api / scoring / worker / postgres / redis
```

- Only Caddy exposes public HTTP/HTTPS ports.
- Application containers communicate through the private production network.
- Databases and internal services are not exposed publicly.

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

## Deployment

```bash
# Deploy an approved commit
RELEASE_COMMIT=<commit-sha> ./scripts/deploy-production.sh
```

The deployment script:

1. Verifies required commands and clean repository state
2. Fetches origin and resolves the release commit
3. Confirms the commit is reachable from origin/main
4. Checks out the exact commit
5. Validates environment variables
6. Builds production Docker images
7. Validates Compose and Caddy configuration
8. Creates a pre-deployment database backup
9. Starts or updates containers
10. Waits for health checks
11. Runs internal health verification
12. Records deployment metadata

## DNS

After services pass internal checks, apply DNS:

```bash
# Review changes
CLOUDFLARE_DRY_RUN=true ./infrastructure/cloudflare/sync-dns.sh

# Apply DNS records
CLOUDFLARE_DRY_RUN=false ./infrastructure/cloudflare/sync-dns.sh
```

## Verification

```bash
# Full verification
./scripts/verify-production.sh

# Specific checks
curl -I https://pte.tnaprovider.com.au/
curl -I https://api.tnaprovider.com.au/health
curl -I https://scoring.tnaprovider.com.au/health
```

## Health Endpoints

| Service | Liveness                                       | Readiness                                       |
| ------- | ---------------------------------------------- | ----------------------------------------------- |
| Web     | https://pte.tnaprovider.com.au/                | —                                               |
| API     | https://api.tnaprovider.com.au/health/live     | https://api.tnaprovider.com.au/health/ready     |
| Scoring | https://scoring.tnaprovider.com.au/health/live | https://scoring.tnaprovider.com.au/health/ready |
