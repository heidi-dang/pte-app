# Database Migrations

## Running Migrations

Migrations are applied automatically when services start using the migration runner in `@pte-app/database`.

```typescript
import { loadDatabaseConfig, createConnection, runMigrations } from '@pte-app/database';

const config = loadDatabaseConfig();
const connection = await createConnection(config, (attempt) => {
  console.log(`Database connection attempt ${attempt}`);
});
await runMigrations(connection, {
  onProgress: (version) => console.log(`Applying migration ${version}`),
});
```

## Adding a Migration

1. Create a new SQL file in `packages/database/src/migrations/` named `0002_description.sql`.
2. Add the migration to `packages/database/src/migrations/runner.ts`.
3. Migration files are idempotent (`CREATE TABLE IF NOT EXISTS`, etc.).

## Safety

- Each migration runs inside a transaction.
- The runner records the migration in `migration_history` only after success.
- If a migration fails, it is rolled back and the journal is not updated.
- The runner verifies checksums for already-applied migrations and fails on mismatch.

## Recovery

If a migration fails:

1. Check the application logs for the precise error.
2. Fix the migration file.
3. Restart the service.

Do not manually edit `migration_history`. If checksums diverge, restore from backup and re-run migrations.

## Rollback

Backward migrations are not automated. To roll back, create a new forward migration that reverses the change and deploy it.
