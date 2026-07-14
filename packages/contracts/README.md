# @pte-app/contracts

Versioned, immutable, strongly typed contracts for the PTE Academic platform.

## Purpose

Defines the data shapes consumed by all services. Contains zero implementation logic.

## Versioning

Every contract includes a `version` field following semver. The package-level `CONTRACT_VERSION` constant tracks the current schema version.

## Contracts

| Contract                | Description                                 |
| ----------------------- | ------------------------------------------- |
| `QuestionContract`      | PTE task definition with scoring principles |
| `AnswerContract`        | Student response to a question              |
| `ExamContract`          | Examination definition with sections        |
| `SessionContract`       | Active exam session lifecycle               |
| `UserProfileContract`   | User identity and preferences               |
| `CourseContract`        | Course structure and metadata               |
| `LessonContract`        | Individual lesson within a course           |
| `ProgressContract`      | Student progress tracking                   |
| `MediaContract`         | Media asset metadata                        |
| `UploadContract`        | File upload state machine                   |
| `AttemptContract`       | Exam attempt with responses                 |
| `ResultContract`        | Scored result with section breakdown        |
| `FeedbackContract`      | AI or human feedback on responses           |
| `AuditEventContract`    | Immutable audit trail entry                 |
| `ConfigurationContract` | Versioned configuration with scopes         |

## Dependencies

- `@pte-app/types` — branded type definitions
