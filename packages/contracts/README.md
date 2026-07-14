# @pte-app/contracts

Versioned, immutable, strongly typed contracts for the PTE Academic platform.

## Purpose

Defines the data shapes consumed by all services. All configuration objects are versioned with explicit IDs, semver versions, status, effective dates, and source provenance.

## Versioning

Every contract includes a `version` field following semver. The package-level `CONTRACT_VERSION` constant tracks the current schema version. All configuration objects are versioned using `ConfigurationId` + `Version` + `ConfigurationStatus`.

## Contracts

| Contract              | Description                                 |
| --------------------- | ------------------------------------------- |
| `QuestionContract`    | PTE task definition with scoring principles |
| `AnswerContract`      | Student response to a question              |
| `ExamContract`        | Examination definition with sections        |
| `SessionContract`     | Active exam session lifecycle               |
| `UserProfileContract` | User identity and preferences               |
| `CourseContract`      | Course structure and metadata               |
| `LessonContract`      | Individual lesson within a course           |
| `ProgressContract`    | Student progress tracking                   |
| `MediaContract`       | Media asset metadata                        |
| `UploadContract`      | File upload state machine                   |
| `AttemptContract`     | Exam attempt with responses                 |
| `ResultContract`      | Scored result with section breakdown        |
| `FeedbackContract`    | AI or human feedback on responses           |
| `AuditEventContract`  | Immutable audit trail entry                 |

## Configuration

All configuration is labelled as estimated training configuration. Each versioned config includes: `id`, `version`, `status`, `effectiveFrom`, `effectiveUntil`, `source`, and `supersededBy`.

Unknown configuration IDs throw explicit errors — no silent fallback.

## Dependencies

- `@pte-app/types` — branded type definitions
