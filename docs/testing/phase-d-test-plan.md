# Phase D Test Plan — Authentication & Session Layer

This document outlines the testing strategy, test layers, and verification commands for the user registration, authentication, session gating, and email-sending flows.

## Scope of Testing

Testing is focused on API-level request parsing, payload validation, credential verification, and route security.

- **Unit Tests**: Test individual route handlers and middleware in isolation using mock database repositories and mock email providers.
- **Integration Tests**: Stateful test scenarios verifying the full auth cycle (register -> email verify -> login -> access protected resource -> logout -> access rejection) within the Fastify framework using in-memory mock repository states.

## Test Directory Structure

```
services/api/src/__tests__/
├── auth.register.unit.test.ts
├── auth.login.unit.test.ts
├── auth.logout.unit.test.ts
├── auth.verify-email.unit.test.ts
├── auth.forgot-password.unit.test.ts
├── auth.reset-password.unit.test.ts
└── auth.integration.test.ts
```

## Running Tests

To run the authentication test suite:

```bash
npm run test:unit --workspace=@pte-app/api
npm run test:integration --workspace=@pte-app/api
```
