# Authentication and Session Operations

## Environment Variables

The following variables configure authentication behaviour. They are required at API startup.

| Variable                   | Purpose                             | Example       |
| -------------------------- | ----------------------------------- | ------------- |
| `SESSION_DURATION_MINUTES` | Lifetime of a session               | `1440`        |
| `BCRYPT_ROUNDS`            | Cost factor for password hashing    | `10`          |
| `SESSION_COOKIE_NAME`      | Name of the session cookie          | `pte_session` |
| `MAX_SESSIONS_PER_USER`    | Max concurrent sessions per account | `10`          |

## Session Lifecycle

1. **Registration** — `POST /auth/register` creates a user, hashes the password, assigns default roles, creates an audit event, and returns the user with a session token.
2. **Login** — `POST /auth/login` verifies the password and creates a new session. If `MAX_SESSIONS_PER_USER` is exceeded, the oldest sessions are revoked.
3. **Authenticated requests** — Clients send the session token in the `Authorization: Bearer <token>` header or as the configured cookie.
4. **Logout** — `POST /auth/logout` revokes the current session.
5. **Revocation** — `DELETE /auth/sessions/:id` revokes a specific session; users can only revoke their own sessions.

## Token Storage

- The client receives an opaque token string.
- The database stores only a SHA-256 hash of the token.
- Tokens are generated with 32 bytes of random data from `crypto.randomBytes`.

## Role Management

Roles are stored in the `user_roles` table. The default registration role is `student`. Administrative endpoints to manage roles will be added in later phases.

## Operations Tasks

- **Rotate session secret/cookie name**: Update the environment variable and redeploy. Existing sessions remain valid because tokens are opaque hashes.
- **Force logout a user**: Revoke all sessions for the user in the database (`sessions.revoked_at` to current timestamp).
- **Adjust session duration**: Change `SESSION_DURATION_MINUTES` and redeploy. Existing sessions keep their original expiry; new sessions use the updated value.
