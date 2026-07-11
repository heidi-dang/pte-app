# Database Operations and Schema Management

This document outlines local development and production workflows for managing the PostgreSQL database schema and migrations using Prisma.

## Setup Local Database

1. Ensure Docker is running.
2. Start the database containers:
   ```bash
   npm run local:up
   ```
3. Copy environment settings and verify:
   ```bash
   npm run setup:local
   npm run doctor
   ```

## Prisma Workflows

The schema is defined in `packages/db/prisma/schema.prisma`. All modifications should be made to this file.

### Generate Prisma Client

To rebuild the Prisma Client after schema changes:

```bash
npm run db:generate --workspace=@pte-app/db
```

### Apply Migrations

To apply pending migrations locally or create a new migration from schema changes:

```bash
npm run db:migrate --workspace=@pte-app/db
```

This command runs in interactive mode if a schema change is detected, prompting for a migration name.

### Push Schema Without Migrations (Prototyping)

For quick prototyping on a local database without creating migration files:

```bash
npm run db:push --workspace=@pte-app/db
```

> [!CAUTION]
> Never use `db:push` in staging or production. Always use migrations.

### Visualise Data (Prisma Studio)

To start the visual editor:

```bash
npm run db:studio --workspace=@pte-app/db
```

This opens Prisma Studio at `http://localhost:5555`.
