# Phase E — Authentication, Sessions, and RBAC

## Scope

Phase E adds account registration, password authentication, server-side sessions, and role-based access control to the API service. It builds directly on Phase D's database package and contains no UI or scoring logic.

## Package

`@pte-app/api` (auth module under `services/api/src/auth/`)

## Design Principles

- **No hardcoded security constants**: session duration, bcrypt cost, cookie name, and session limits are environment-driven.
- **Server-side sessions**: Tokens are random bytes; only a SHA-256 hash is stored.
- **Password hashing**: `bcrypt` with configurable rounds.
- **Role-based access control**: Permissions are derived from roles; roles are stored in the database.
- **Auditability**: Authentication events are written to the immutable audit trail.
- **Graceful degradation**: Auth routes are unavailable if the database is unreachable, but health endpoints remain responsive.

## Auth Module Structure

| File          | Responsibility                                 |
| ------------- | ---------------------------------------------- |
| `config.ts`   | Loads session/auth configuration from env      |
| `crypto.ts`   | Bcrypt hash/verify and secure token generation |
| `accounts.ts` | Registration and password verification         |
| `sessions.ts` | Session creation, lookup, revocation           |
| `rbac.ts`     | Roles, permissions, and route guards           |
| `plugin.ts`   | Fastify routes, decorators, and hooks          |

## Roles and Permissions

| Role             | Permissions                                          |
| ---------------- | ---------------------------------------------------- |
| `student`        | `content:read`, `assessment:take`, `progress:read`   |
| `teacher`        | `content:read`, `content:write`, `assessment:review` |
| `admin`          | All permissions                                      |
| `content_editor` | `content:read`, `content:write`, `content:publish`   |

Roles are assigned during registration and can be managed later by administrators.

## Routes

| Method | Path                 | Auth required | Purpose                 |
| ------ | -------------------- | ------------- | ----------------------- |
| POST   | `/auth/register`     | No            | Create account          |
| POST   | `/auth/login`        | No            | Authenticate            |
| POST   | `/auth/logout`       | Yes           | Revoke current session  |
| GET    | `/auth/me`           | Yes           | Current user            |
| GET    | `/auth/sessions`     | Yes           | List active sessions    |
| DELETE | `/auth/sessions/:id` | Yes           | Revoke specific session |

## Local Development

Ensure PostgreSQL is running and `.env.local` contains:

```
SESSION_DURATION_MINUTES=1440
BCRYPT_ROUNDS=10
SESSION_COOKIE_NAME=pte_session
MAX_SESSIONS_PER_USER=10
```

## Testing

Unit tests cover crypto, config, and RBAC helpers. Integration tests exercise the full HTTP flow against a real database, including duplicate rejection, login/logout, session listing/revocation, and password validation.
