# Phase B Test Plan

## Unit Coverage

- API health endpoint responses (Fastify injection)
- Scoring health endpoint responses (Fastify injection)
- Worker configuration validation
- Environment variable parsing
- Script error handling

## Integration Coverage

- Graceful service startup and shutdown
- Root workspace discovery

## Smoke Coverage

- Web application HTTP response
- API /health/live and /health/ready
- Scoring /health/live and /health/ready
- Worker health check

## CI Gates

- Format check (Prettier)
- Lint (ESLint)
- Type checking (TypeScript)
- Phase A documentation validation
- Workspace validation
- Unit and integration tests
- Build
- End-to-end smoke test

## Excluded (later phases)

- Database migrations
- Scoring algorithms
- Authentication
- Payment integration
- Provider integration
