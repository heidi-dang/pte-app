# ADR-0001: Monorepo Structure

## Status

Accepted

## Context

The PTE Academic platform requires multiple applications and services that share common code, types, schemas and configuration. These include:

- Web application (Next.js)
- API service (Node.js)
- Worker service
- Scoring service
- Shared UI components
- Shared contracts and types
- Database schemas
- Content schemas
- Infrastructure configuration

Without a monorepo, each component would need independent versioning, dependency management and CI/CD pipelines, increasing maintenance overhead and making coordinated changes difficult.

## Decision

Use a monorepo to contain all platform code, configuration and documentation.

## Alternatives Considered

- **Multi-repo**: Separate repositories for each service. Rejected due to coordination overhead, duplicated configuration and difficulty of atomic cross-service changes.
- **Hybrid**: Core shared libraries in one repo with services in separate repos. Rejected due to added complexity without proportional benefit.

## Advantages

- Atomic commits across all platform components
- Shared dependency management and versioning
- Consistent tooling, linting and formatting
- Single CI/CD pipeline configuration
- Easier onboarding for developers
- Simplified code review across boundaries

## Trade-offs

- Larger repository size
- CI pipeline must be scoped to changed components
- Requires disciplined code ownership and boundaries
- More complex branch management

## Consequences

- The monorepo will use a package manager with workspace support
- CI pipeline will include change detection to limit test execution to affected components
- Code ownership will be enforced via CODEOWNERS
- Shared libraries will be in the packages directory
- Applications will be in the apps directory
- Services will be in the services directory
