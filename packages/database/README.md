# @pte-app/database

PostgreSQL persistence foundation for the PTE Academic platform.

## Purpose

Provides typed database connection, migrations, transaction helpers, health checks, and repository interfaces. Keeps business rules outside the database package.

## Stack

- PostgreSQL (managed via Docker Compose in local development)
- `pg` Node.js driver
- Plain SQL migrations

## Configuration

Environment variables (no hardcoded values):

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_SSL` (optional)
- `POSTGRES_MAX_CONNECTIONS` (optional)
- `POSTGRES_CONNECTION_TIMEOUT_MS` (optional)
- `POSTGRES_IDLE_TIMEOUT_MS` (optional)
- `POSTGRES_RETRY_ATTEMPTS` (optional)
- `POSTGRES_RETRY_DELAY_MS` (optional)

## Modules

- `config.ts` — configuration loader
- `client.ts` — connection factory with retry
- `transaction.ts` — transaction helper
- `health.ts` — health check
- `migrations/runner.ts` — migration runner
- `migrations/journal.ts` — migration journal and checksums
- `repositories/*` — persistence repositories
- `testing/setup.ts` — test database helpers

## Migrations

Migrations are plain SQL files in `src/migrations/`. The runner applies them in order and records each applied migration in `migration_history` with a checksum.

## Recovery

Migrations run inside a transaction. A failed migration rolls back without corrupting the journal. Student and account data survive process restarts because all persistence is in PostgreSQL.

## Models

- `users`
- `user_profiles`
- `user_roles`
- `sessions`
- `configuration_versions`
- `audit_events`
- `media_metadata`
- `content_contracts`
- `migration_history`
