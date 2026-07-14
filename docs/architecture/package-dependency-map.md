# Package Dependency Map

## Dependency Graph

```
@pte-app/types          (zero dependencies)
    ↓
@pte-app/contracts      (depends on: types)
    ↓
┌───────────────────┐   ┌──────────────────┐
│ @pte-app/schemas  │   │ @pte-app/domain  │
│ (depends on:      │   │ (depends on:     │
│  contracts, zod)  │   │  contracts)      │
└───────────────────┘   └──────────────────┘
    ↓
@pte-app/provenance     (depends on: contracts, types)
```

## Rules

1. **`@pte-app/types`** has zero runtime dependencies. It exports only TypeScript type definitions.
2. **`@pte-app/contracts`** depends only on `@pte-app/types`. It exports contract interfaces and versioned configuration fixtures.
3. **`@pte-app/schemas`** depends on `@pte-app/contracts` and `zod`. It exports Zod validation schemas.
4. **`@pte-app/domain`** depends only on `@pte-app/contracts`. It exports domain types and pure functions.
5. **`@pte-app/provenance`** depends on `@pte-app/contracts` and `@pte-app/types`. It must NOT depend on `@pte-app/domain` or `@pte-app/schemas`.

## Prohibited Dependencies

- Circular dependencies between any packages
- `provenance` → `domain`
- `provenance` → `schemas`
- Any package → infrastructure (database, HTTP, filesystem)
- Any package → application code (UI, API routes)

## Validation

The `validate-workspace` script checks that all required Phase C packages exist. Package-level `tsconfig.json` enforces compile-time dependency direction.
