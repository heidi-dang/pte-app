# ADR-0003: Versioned Content and Scoring

## Status

Accepted

## Context

The platform stores student practice and mock exam responses, scores and reports. Content questions and scoring profiles may be updated over time to improve accuracy, fix errors or add new content.

If content or scoring profiles are modified in place, historical student results would change silently, undermining trust and making progress tracking unreliable.

## Decision

Published content and scoring profiles are immutable versions. Revisions create new versions. Historical results always reference the exact versions that were used when the result was created.

## Alternatives Considered

- **Mutable content with timestamp**: Content can be edited and timestamps used to determine which version was active. Rejected because it makes historical reconstruction complex and error-prone.
- **Mutable content with change log**: Content can be edited but changes are logged. Rejected because it does not guarantee that re-scoring with current logic would match original results.
- **Soft-delete and replace**: Content is retired and replaced. Rejected because it breaks the link between historical attempts and their content.

## Advantages

- Historical results are always reproducible
- Scoring profile changes do not alter past student progress
- Content updates do not break in-progress practice sessions
- Clear audit trail of what content and scoring was used when

## Trade-offs

- Storage grows with each version
- Requires version management tooling
- Content authors must understand versioning workflow
- Reports must display the version information alongside scores

## Consequences

- When a question is revised, a new version is created with an incremented version number.
- Active practice sessions continue using the question version they started with.
- New practice sessions use the latest published version.
- Scoring profiles are versioned independently of content.
- Each score record stores the scoring profile version and question version.
- Retired content remains available for viewing in historical reports but is not used for new sessions.
- A super administrator can deprecate a content version to prevent new sessions from using it.
