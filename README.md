# PTE Academic Learning Platform

## Product Purpose

A complete commercial online PTE Academic learning platform that improves real student performance through:

**Diagnose → Teach → Practise → Explain → Review → Repeat → Test → Calibrate**

This is an independent PTE Academic preparation platform. It is not affiliated with, endorsed by or operated by Pearson.

## Current Project Status

Phase A — Product Contract (accepted at 98/100).
Phase B — Monorepo, tooling and local environment foundation.
Phase Y — Production deployment (Caddy, Cloudflare DNS, Docker Compose).

## Supported PTE Product

- PTE Academic
- English interface
- All current PTE Academic task types (Speaking, Writing, Reading, Listening)

## Main User Roles

- Guest
- Free student
- Paid student
- Teacher
- Content writer
- Content reviewer
- Administrator
- Super administrator

## Planned Applications and Services

- Public website
- Student portal
- Teacher portal
- Content portal
- Administration portal
- API service
- Worker service
- Scoring service
- Shared UI component library
- Shared contracts and types

## Development Phases

| Phase | Description                                               |
| ----- | --------------------------------------------------------- |
| A     | Product contract                                          |
| B     | Monorepo, tooling and local environment                   |
| C     | Shared contracts and configuration                        |
| D     | Database and domain model                                 |
| E     | Authentication, profiles and permissions                  |
| F     | Design system and application shell                       |
| G     | Content provenance and licence register                   |
| H     | Course and lesson engine                                  |
| I     | Universal question engine                                 |
| J     | Reading task types                                        |
| K     | Listening task types                                      |
| L     | Speaking recorder and speaking tasks                      |
| M     | Writing task types                                        |
| N     | Objective scoring engine                                  |
| O     | Speech and writing evaluation                             |
| P     | Diagnostic test and personalised study plan               |
| Q     | Mock-exam engine                                          |
| R     | Dashboard, reports and skill mastery                      |
| S     | Teacher and administration portals                        |
| T     | Payments, subscriptions and entitlements                  |
| U     | Content-production factory                                |
| V     | Calibration and educational validation                    |
| W     | Notifications, support and operations                     |
| X     | Complete QA and performance gate                          |
| Y     | Production deployment (Caddy, Cloudflare, Docker Compose) |
| Z     | Pilot, launch and continuous improvement                  |

## Repository Structure

```
pte-app/
├── apps/              Application projects
├── content/           Question banks and media
├── docs/              All documentation
│   ├── architecture-decisions/
│   ├── content/
│   ├── operations/
│   ├── product/
│   ├── scoring/
│   └── testing/
├── infrastructure/    Deployment and infrastructure
├── packages/          Shared libraries
├── scripts/           Utility scripts
├── services/          Backend services
├── tests/             Test suites
├── .editorconfig
├── .gitattributes
├── .gitignore
├── LICENSE
└── README.md
```

## Configuration Principles

- No application service, model, URL, domain, port, price, score weight or question count may be hardcoded.
- External services must be accessed through internal provider interfaces.
- Provider names, endpoints and models must not appear in feature code.
- Published content and scoring profiles are immutable versions.
- Practice and mock-test sessions use persisted server-side state with local recovery support.

## Testing Requirements

- Unit tests for scoring rules, timer behaviour, text normalisation, study-plan calculations, entitlements and content validation.
- Integration tests for API and database, API and Redis, worker and Redis, API and scoring service, object storage, payment webhook processing and content import.
- End-to-end tests for all major user journeys.
- Stability tests for API restart, worker restart, Redis restart, temporary database loss, object-storage interruption, provider timeout, internet interruption, duplicate submission and duplicate webhook.
- Browser matrix: Chrome, Edge, Safari, Firefox, iPhone Safari, Android Chrome.

## Content Principles

- All content must have documented provenance, source and licence.
- Published questions must be original or properly licenced.
- No copied competitor question banks, recalled live examination questions or unlicensed materials.
- Content below 9/10 review score may not be published.
- Every content item requires: author, source, licence, commercial-use status, reviewer, review score, version, correct answer, explanation, difficulty, skills and publication status.

## Scoring Principles

- Platform scores are estimated training scores. They are not official PTE scores.
- Pearson's private scoring engine will not be represented as reproduced.
- Objective questions use deterministic scoring.
- AI must not provide unsupported final scores.
- Speaking scoring distinguishes constrained-response tasks (word alignment, sequence comparison, accepted-answer matching) from open-response tasks (content concepts, relevance, main-point coverage, organisation).
- Writing scoring uses: content, form, structure, coherence, grammar, vocabulary, linguistic range and spelling.
- Every result stores scoring-profile version, question version, provider version, component evidence and confidence range.
- Historical results cannot silently change after a scoring update.
- New scoring profiles require regression testing and calibration.

## Local Development

```bash
npm ci               # Install dependencies
npm run setup:local  # Prepare local environment
npm run doctor       # Verify environment
npm run local:up     # Start all services
```

- Web: http://localhost:${WEB_PORT:-3000}
- API: http://localhost:${API_PORT:-4000}
- Scoring: http://localhost:${SCORING_PORT:-5000}

## Production Deployment

See `docs/deployment/production.md` for deployment instructions.

Production endpoints:

- Web: https://pte.tnaprovider.com.au
- API: https://api.tnaprovider.com.au
- Scoring: https://scoring.tnaprovider.com.au

See `docs/operations/local-development.md` for detailed setup and troubleshooting.

The current UI is a Phase B environment page, not the finished product.

## Definition of Done

- Feature implemented according to specification.
- All required tests pass.
- Documentation updated.
- No unresolved placeholders.
- Self-audit score at least 98/100.
- Phase audit passes at 98/100 threshold.

## Current Active Phase

**Phase B** — Monorepo, tooling and local environment. Building the local development foundation.

## Contribution Workflow

1. Receive one phase specification.
2. Pull latest main.
3. Create phase branch: `feat/phase-<letter>-<description>` or `fix/phase-<letter>-<description>`.
4. Implement phase.
5. Run checks.
6. Commit using conventional commit format.
7. Push.
8. Submit report.
9. Stop.
10. Audit.
11. Fix audit findings.
12. Receive next phase.

Every released phase must score at least 98/100 in audit. Developers must stop after every phase and wait for approval. No phase may begin without approval of the previous phase.

Student work must be recoverable. Long-running operations must expose progress.

No direct development on main.
