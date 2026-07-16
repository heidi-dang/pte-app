# Self-Hosted CI Runners

Four GitHub Actions self-hosted runners run on the Alienware R8 (Ubuntu 25.10, 16 cores, 30 GB RAM).

## Runner instances

| Name           | Service                         | Directory                       |
| -------------- | ------------------------------- | ------------------------------- |
| alienware-r8-1 | actions.runner.*.alienware-r8-1 | ~/github-runners/alienware-r8-1 |
| alienware-r8-2 | actions.runner.*.alienware-r8-2 | ~/github-runners/alienware-r8-2 |
| alienware-r8-3 | actions.runner.*.alienware-r8-3 | ~/github-runners/alienware-r8-3 |
| alienware-r8-4 | actions.runner.*.alienware-r8-4 | ~/github-runners/alienware-r8-4 |

## Labels

All runners share: `self-hosted`, `linux`, `x64`, `alienware-r8`

## CI workflow

The full CI (`.github/workflows/ci.yml`) runs 5 parallel jobs:

- `static-checks` – lint, format, typecheck, docs, tooling tests
- `unit-integration-api` – unit, integration, and API tests (with Postgres + Redis)
- `build` – Turbo build
- `e2e` – Playwright E2E tests (with Postgres + Redis)
- `final-workspace-check` – workspace validation, git diff, dirty-tree check (after prior jobs)

A lightweight `quick-ci.yml` workflow provides fast feedback on formatting, linting, typechecking, and unit tests.

## Service ports

Postgres and Redis use dynamically mapped container ports to avoid collisions when multiple jobs run on the same host.
