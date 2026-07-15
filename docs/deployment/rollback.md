# Rollback

## Automatic Rollback

The deployment script automatically triggers a rollback when the new release fails its acceptance checks (health check failure).

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

1. A pre-rollback database backup is created.
2. The rollback target commit is verified (must be reachable from origin/main).
3. The deployment script is called with the rollback commit.
4. Health checks confirm the rollback succeeded.

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
- Manual backups: `./scripts/backup-production.sh`
- Manual restore: `./scripts/restore-production.sh <backup-dir>`
