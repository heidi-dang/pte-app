# ADR 0005: Stateful Session Token Authentication

## Status

Approved

## Context

For Phase D, we require a secure, reliable, and easily invalidatable authentication mechanism. The two main options considered were:

1. **Opaque Stateful Session Tokens**: Generated server-side, stored in a database `Session` table, and checked against the database on each request.
2. **Stateless JSON Web Tokens (JWTs)**: Self-contained cryptographically signed payloads validated entirely in-memory.

## Decision

We chose **Opaque Stateful Session Tokens** for the core authentication layer.

### Rationale

- **Immediate Invalidation (Logout & Security Resets)**: In a commercial-grade learning platform, administrators must be able to immediately terminate user sessions (e.g. on password reset, account suspension, or subscription termination). Stateless JWTs require complex and resource-heavy blocklisting to achieve immediate invalidation.
- **Simplicity & Security**: Opaque tokens contain no user information, eliminating risk of data exposure in client-side storage.
- **Sliding Window Session Management**: Statefulness allows easy implementation of the idle timeout (`SESSION_IDLE_TIMEOUT_SECONDS`) by updating session expiration on active requests.
- **Low-overhead Database Lookups**: Database queries for session lookup are highly optimized index checks (`@@index([token])`) and scale effectively with connection pooling.

## Implications

- A database query is required to authenticate protected route requests.
- To maintain performance, the `Session` table has indexes on `token`, `userId`, and `expiresAt`.
- A periodic cleanup job or route is required to delete expired sessions (`pruneExpiredSessions`) to prevent database bloat.
