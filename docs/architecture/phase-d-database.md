# Phase D — Database and Persistence

## Scope

Phase D establishes the persistent database foundation required by later phases. It contains zero authentication, UI, scoring, or course logic.

## Package

`@pte-app/database`

## Design Principles

- **No hardcoded connection details**: All values come from environment variables.
- **Recoverability**: Account and student data survive process restarts.
- **Migration safety**: Migrations are transactional and checksum-verified.
- **Separation of concerns**: Business rules live outside the database package.
- **Observability**: Connection retries report progress; startup failures report precise blockers.

## Models

| Table                    | Purpose                         |
| ------------------------ | ------------------------------- |
| `users`                  | Account identities              |
| `user_profiles`          | Profile preferences             |
| `user_roles`             | Role assignments                |
| `sessions`               | Persistent server-side sessions |
| `configuration_versions` | Versioned configuration storage |
| `audit_events`           | Immutable audit trail           |
| `media_metadata`         | Media asset metadata            |
| `content_contracts`      | Versioned content contracts     |
| `migration_history`      | Applied migration journal       |

## Local Development

PostgreSQL starts via `docker compose --env-file .env.local up -d`. The API and other services connect using the environment variables in `.env.local`.

## Testing

Unit tests cover configuration, migration journal checksums, transaction behaviour, and health checks. Integration tests require a running PostgreSQL instance and use a dedicated test database (`*_test`).
