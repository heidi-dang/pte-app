# Phase H — File Ownership Map

## Phase H files (vs main)

```
apps/web/src/app/learn/catalogue/page.tsx
apps/web/src/app/learn/courses/[slug]/page.tsx
apps/web/src/app/learn/lessons/[id]/page.tsx
apps/web/src/components/InteractiveBlock.tsx
docs/phase-h/implementation-contract.md
docs/phase-h/file-ownership.md
packages/contracts/src/index.ts
packages/contracts/src/phase-h/index.ts
packages/database/src/database.integration.test.ts
packages/database/src/index.ts
packages/database/src/migrations/0004_phase_h.sql
packages/database/src/migrations/runner.ts
packages/database/src/repositories/phase-h/courses.ts
packages/database/src/repositories/phase-h/enrolments.ts
packages/database/src/repositories/phase-h/index.ts
packages/database/src/repositories/phase-h/lesson-blocks.ts
packages/database/src/repositories/phase-h/lessons.ts
packages/database/src/repositories/phase-h/modules.ts
packages/database/src/repositories/phase-h/prerequisites.ts
packages/database/src/repositories/phase-h/progress.ts
packages/database/src/repositories/phase-h/quizzes.ts
packages/database/src/repositories/phase-h/teacher-notes.ts
services/api/src/app.ts
services/api/src/phase-h/plugin.ts
```

## Dev 2 collision review

Dev 2 branch: `feat/dev2-phase-i-j-k-structure` (56 files)

### Shared files (2):

1. **`packages/database/src/migrations/runner.ts`**
   - Phase H adds: `await loadMigration('0004', 'phase_h')`
   - Dev 2 adds: `await loadMigration('0004', 'question_engine')`
   - Collision: Both use migration number 0004. Resolution: The second branch merged will need to renumber to 0005. Both migrations are additive and non-overlapping in table scope.

2. **`services/api/src/app.ts`**
   - Phase H adds: `import { phaseHPlugin } from './phase-h/plugin.js'` and `await app.register(phaseHPlugin, { db: dbConnection })`
   - Dev 2 adds: `import { questionEnginePlugin } from './question-engine/plugin.js'` and `await app.register(questionEnginePlugin, ...)`
   - Both are cleanly mergeable (additive plugin registrations at the same point in the file after contentProvenancePlugin).

### Non-overlapping:

All other Phase H files are in `packages/contracts/src/phase-h/`, `packages/database/src/repositories/phase-h/`, `services/api/src/phase-h/`, and `apps/web/src/app/learn/` — none of these paths appear in the Dev 2 branch.

### No Dev 1 modification of Dev 2-owned files

Phase H does not modify any of Dev 2's `packages/contracts/src/question.ts`, `packages/contracts/src/session.ts`, or any phase-i/j/k files. No shared contracts broken.
