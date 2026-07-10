# ADR-0002: Provider Adapters

## Status

Accepted

## Context

The platform depends on several external services:

- Speech-to-text
- Text-to-speech
- Language-model feedback (for speaking and writing evaluation)
- Object storage
- Email sending
- Payment processing

Direct embedding of provider-specific code in feature logic would create tight coupling, making it difficult to switch providers, version APIs or test in isolation.

## Decision

External services must be accessed through internal provider interfaces (adapters). Feature code depends only on the interface, never on a specific provider implementation.

## Alternatives Considered

- **Direct SDK usage**: Calling provider SDKs directly from feature code. Rejected due to tight coupling and difficulty of testing.
- **Provider-agnostic facade with direct calls**: A thin wrapper without proper interface abstraction. Rejected because it still leaks provider abstractions.
- **Sidecar pattern**: Running provider integrations as separate processes. Rejected due to deployment complexity for the current scale.

## Advantages

- Provider implementation can be swapped without changing feature code
- Testing can use mock adapters without network calls
- Provider version changes are isolated to the adapter
- Feature code is cleaner and focused on business logic

## Trade-offs

- Additional abstraction layer
- Adapter interface must anticipate all needed capabilities
- Provider-specific features may not be expressible through a generic interface
- Requires adapter implementation for each provider

## Consequences

- Provider names, endpoints and models cannot be hardcoded in feature code.
- Each external service has a corresponding adapter interface in a shared package.
- Adapter implementations are injected via dependency injection.
- Configuration for the active provider is stored in environment-specific configuration.
- CI tests use mock adapters for all external services.
- Each adapter implementation includes integration tests against the real provider.
