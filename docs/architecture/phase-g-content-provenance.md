# Phase G — Content Provenance, Licence Register and Publication Controls

## Scope

Phase G implements a complete provenance and licensing control layer that ensures every publishable content item is traceable to verifiable evidence.

## Packages

- `packages/contracts/src/content-provenance/` — contract types
- `packages/schemas/src/content-provenance.ts` — Zod validation
- `packages/domain/src/content-provenance/` — pure eligibility rules
- `packages/provenance/src/` — similarity provider interface
- `packages/database/` — migrations and repositories

## Tables

| Table                           | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `content_sources`               | Source registration and status                          |
| `content_licences`              | Versioned licence records                               |
| `content_evidence`              | Evidence metadata and checksums                         |
| `content_provenance`            | Provenance linking content to source, licence, evidence |
| `content_provenance_versions`   | Immutable history snapshots                             |
| `content_similarity_checks`     | Similarity and duplication check results                |
| `content_publication_decisions` | Eligibility snapshots                                   |
| `content_reverification_jobs`   | Expiry and re-verification queue                        |

## Publication eligibility rules

Content is blocked when:

- No provenance record exists
- Provenance is not verified
- Source is disputed or retired
- Licence missing, expired, or revoked
- Commercial use or modification not allowed
- Attribution required but absent
- Evidence missing or invalid
- Similarity check pending or exceeding threshold
- Content version changed
- Re-verification required
- Policy version missing

## Permissions

- `content_editor`: create drafts, submit for review, cannot approve
- `admin`: view all, verify, reject, supersede, audit
- `support`: read limited status
- `teacher`, `student`: no access
