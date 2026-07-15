# Rollback

## Automatic Rollback

The deployment script automatically triggers a rollback when:

- Service health checks fail after deployment
- Internal health checks fail
- HTTPS verification fails (in production verification mode)
- TLS certificate verification fails (in production verification mode)

## Manual Rollback

### Rollback to the previous commit

```bash
./scripts/rollback-production.sh
```

### Rollback to a specific commit

```bash
ROLLBACK_COMMIT=<commit-sha> ./scripts/rollback-production.sh
```

## Rollback Process

1. A pre-rollback database backup is created (mandatory).
2. The rollback target commit is verified (must exist and be reachable from origin/main).
3. The deployment script is called with the rollback commit.
4. Health checks confirm every service is healthy.
5. Rollback failure exits non-zero.

## DNS Rollback

The Cloudflare DNS sync script saves previous record values before making changes.

Rollback data location: `/tmp/cloudflare-dns-rollback-*.json`

To restore previous DNS records:

1. Read the rollback JSON file for previous record IDs and content values
2. Use the Cloudflare API or dashboard to restore the previous values

## Persistent Data

- Database data is stored in the `pgdata` Docker volume.
- Redis data is stored in the `redisdata` Docker volume.
- Both volumes persist across container restarts and redeployments.
- Pre-deployment and pre-rollback backups are created automatically.
- Backup includes SHA256 checksum and validates the dump is non-empty.
- Manual backups: `./scripts/backup-production.sh`
- Manual restore: `./scripts/restore-production.sh <backup-dir>`

## Rollback safety

- Rollback uses the recorded previous commit from the deploy log, not a `latest` tag.
- Before deployment, the previous commit and image state are recorded.
- After rollback, all services are health-checked before the script exits.
- If rollback itself fails, the script exits non-zero.
