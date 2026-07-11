# Phase C Test Plan

This document outlines the testing strategy, test layers, and verification commands for the database and data-access layers introduced in Phase C.

## Scope of Testing

Testing is focused exclusively on the database schema constraints and repository factory logic.

- **Unit Tests**: Test the logical behavior of all repositories under `packages/db/src/repositories/` using an in-memory mocked Prisma client.
- **Contract/Type Verification**: Ensure all Prisma models are correctly exported and can be built by TypeScript.

## Test Directory Structure

```
packages/db/src/__tests__/
├── users.unit.test.ts
├── sessions.unit.test.ts
├── content.unit.test.ts
├── attempts.unit.test.ts
├── scoring.unit.test.ts
├── study-plans.unit.test.ts
├── subscriptions.unit.test.ts
└── audit.unit.test.ts
```

## Running Tests

### Unit Tests

To run unit tests locally:

```bash
npm run test:unit --workspace=@pte-app/db
```

### TypeScript Validation

To run TypeScript compiler diagnostics:

```bash
npm run typecheck --workspace=@pte-app/db
```
