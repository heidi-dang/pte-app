# @pte-app/types

Core branded types and utility types for the PTE Academic platform.

## Purpose

Provides compile-time-only type definitions used across all packages. No runtime code is exported.

## Exports

### Branded Types

All domain identifiers use branded types to prevent accidental misuse:

- `UserId`, `QuestionId`, `ExamId`, `SessionId`, `CourseId`, `LessonId`
- `AttemptId`, `MediaId`, `UploadId`, `ResultId`, `FeedbackId`
- `AuditEventId`, `ProgressId`, `ConfigurationId`

### Primitive Wrappers

- `ISO8601DateTime` — ISO 8601 formatted datetime string
- `ISO8601Date` — ISO 8601 formatted date string
- `NonEmptyString` — String guaranteed non-empty at the type level
- `PositiveInteger` — Number guaranteed positive
- `NonNegativeInteger` — Number guaranteed >= 0
- `Percentage` — Number representing 0-100
- `Version` — Semver version string

### Utility Types

- `JsonValue`, `JsonObject` — Safe JSON serialization types
- `ReadonlyDeep<T>` — Deeply immutable version of any type
- `Primitive` — Union of JavaScript primitive types
- `Optional<T, K>` — Makes selected keys optional
- `Prettify<T>` — Flattens intersection types for readability
