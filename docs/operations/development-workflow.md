# Development Workflow

## Process

1. Receive one phase specification
2. Pull latest main branch
3. Create phase branch: `feat/phase-<letter>-<description>` or `fix/phase-<letter>-<description>`
4. Implement the phase requirements
5. Run all validation checks
6. Commit using conventional commit format
7. Push to GitHub
8. Submit completion report
9. Stop all development
10. Wait for audit
11. Fix any audit findings
12. Receive next phase specification

## Branch Format

- Feature branches: `feat/phase-<letter>-<description>`
- Fix branches: `fix/phase-<letter>-<description>`
- Letters follow alphabetical order: A, B, C, etc.
- Descriptions are lowercase with hyphens

## Commit Format

All commits must follow conventional commit format:

- `docs:` — Documentation changes
- `feat:` — New feature
- `fix:` — Bug fix
- `test:` — Test additions or changes
- `refactor:` — Code refactoring
- `chore:` — Maintenance, tooling, dependencies

## Rules

- No direct development on main.
- All work must occur on feature or fix branches.
- No phase may begin without approval of the previous phase.
- Every phase must self-audit before committing.
- Self-audit score below 98/100 must be fixed before committing.
