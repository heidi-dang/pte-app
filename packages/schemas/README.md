# @pte-app/schemas

Runtime validation schemas for all PTE Academic contracts.

## Purpose

Provides Zod schemas that mirror every contract type. Used for input validation, deserialization verification, and API boundary checks.

## Usage

```typescript
import { QuestionContractSchema } from '@pte-app/schemas';

const result = QuestionContractSchema.safeParse(data);
if (result.success) {
  // result.data is a validated question
}
```

## Schemas

Each contract has a corresponding `*Schema` export:

- `QuestionContractSchema`
- `AnswerContractSchema`
- `ExamContractSchema`
- `SessionContractSchema`
- `UserProfileContractSchema`
- `CourseContractSchema`
- `LessonContractSchema`
- `ProgressContractSchema`
- `MediaContractSchema`
- `UploadContractSchema`
- `AttemptContractSchema`
- `ResultContractSchema`
- `FeedbackContractSchema`
- `AuditEventContractSchema`
- `ConfigurationContractSchema`

### Configuration Schemas

- `TimingProfileSchema`
- `QuestionMetadataConfigSchema`
- `ExamMetadataConfigSchema`
- `MediaMetadataConfigSchema`
- `LanguageMetadataConfigSchema`
- `FeatureFlagsSchema`

## Dependencies

- `@pte-app/contracts` — contract type definitions
- `zod` — runtime schema validation
