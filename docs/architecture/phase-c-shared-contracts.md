# Phase C — Shared Contracts

## Scope

Phase C establishes the foundational type system, versioned contracts, runtime validation schemas, pure domain models, and provenance definitions for the PTE Academic platform.

## Packages

| Package               | Purpose                                                     | Runtime code              |
| --------------------- | ----------------------------------------------------------- | ------------------------- |
| `@pte-app/types`      | Branded types and utility types                             | No (types only)           |
| `@pte-app/contracts`  | Versioned contract interfaces and configuration definitions | Configuration fixtures    |
| `@pte-app/schemas`    | Zod runtime validation schemas                              | Schema definitions        |
| `@pte-app/domain`     | Pure domain models with factory and query functions         | Factory + query functions |
| `@pte-app/provenance` | Audit chain, version history, event filtering               | Pure in-memory functions  |

## Design Principles

- **Immutable by construction**: All exported objects are deeply frozen.
- **Strongly typed identifiers**: Every entity ID uses a branded type from `@pte-app/types`.
- **Versioned configuration**: All configuration objects carry a configuration ID, semantic version, status, effective dates, and source provenance.
- **No silent fallbacks**: Unknown configuration IDs throw explicit errors.
- **No infrastructure**: Phase C packages contain zero persistence, network, or framework code.

## Dependency Direction

```
types
  ↓
contracts
  ↓
schemas / domain
  ↓
provenance (depends on contracts + types only)
```

Circular dependencies are prohibited.

## Configuration Objects

All configuration is labelled as estimated training configuration unless a properly licensed source is recorded. Configuration objects include:

- **Timing profiles**: Task-level preparation, response, and review durations.
- **Metadata defaults**: Question, exam, and media metadata configuration.
- **Feature flags**: Environment-specific feature toggles.
- **Language support**: Supported and enabled languages.

## What Phase C Does NOT Include

- No APIs, UI, authentication, or database code
- No scoring engines or question logic
- No deployment or infrastructure
- No Phase D work
