# @pte-app/domain

Pure domain models for the PTE Academic platform.

## Purpose

Provides domain types and pure functions derived from contracts. Contains no infrastructure, persistence, or framework dependencies.

## Usage

```typescript
import { createQuestion, questionTaskType } from '@pte-app/domain';
import type { QuestionContract } from '@pte-app/contracts';

const contract: QuestionContract = {/* ... */};
const question = createQuestion(contract);
console.log(questionTaskType(question));
```

## Models

Each contract has a corresponding domain model and factory function:

- `Question` / `createQuestion` + query functions
- `Exam` / `createExam` + query functions
- `Session` / `createSession` + query functions
- `UserProfile` / `createUserProfile` + query functions
- `Course` / `createCourse` + query functions
- `Lesson` / `createLesson` + query functions
- `Progress` / `createProgress` + query functions
- `Media` / `createMedia` + query functions
- `Upload` / `createUpload` + query functions
- `Attempt` / `createAttempt` + query functions
- `Result` / `createResult` + query functions
- `Feedback` / `createFeedback` + query functions
- `AuditEvent` / `createAuditEvent` + query functions

## Design

- All models are immutable (`readonly` fields)
- Factory functions map directly from contract types
- Query functions provide pure, stateless domain logic
- No side effects, no I/O, no infrastructure
