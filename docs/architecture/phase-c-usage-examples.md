# Phase C Usage Examples

## Working with Branded Types

```typescript
import type { QuestionId, UserId, Version } from '@pte-app/types';

// Create branded IDs using type assertions
const questionId = 'q-1' as QuestionId;
const userId = 'u-1' as UserId;
const version = '1.0.0' as Version;

// Branded types prevent accidental interchange
// This would cause a compile error:
// const wrong: UserId = questionId; // Error: Type 'QuestionId' is not assignable to type 'UserId'
```

## Using Versioned Timing Profiles

```typescript
import { getTimingProfile, requireTimingProfile, TRAINING_TIMING_PROFILES } from '@pte-app/contracts';

// Look up by section and task type
const profile = getTimingProfile('speaking', 'read-aloud');
if (profile) {
  console.log(profile.preparationSeconds); // 30
  console.log(profile.source); // 'estimated-training-configuration'
}

// Throw if not found
const required = requireTimingProfile('writing', 'write-essay');

// Iterate all training profiles
for (const p of TRAINING_TIMING_PROFILES) {
  console.log(`${p.profileId}: ${p.responseSeconds}s response`);
}
```

## Working with Versioned Configuration

```typescript
import {
  TRAINING_QUESTION_CONFIG,
  requireQuestionConfig,
  TRAINING_DEFAULT_FLAGS,
  requireFeatureFlagsForEnvironment,
} from '@pte-app/contracts';
import type { ConfigurationId } from '@pte-app/types';

// Access the active question config
const qConfig = TRAINING_QUESTION_CONFIG;
console.log(qConfig.config.maxPromptLength); // 5000
console.log(qConfig.version); // '1.0.0'

// Throw for unknown config
try {
  requireQuestionConfig('nonexistent' as ConfigurationId);
} catch (e) {
  // Error: Unknown question configuration: nonexistent
}

// Access environment-specific feature flags
const prodFlags = requireFeatureFlagsForEnvironment('production');
console.log(prodFlags.flags.aiScoring); // false
```

## Schema Validation

```typescript
import { QuestionContractSchema, VersionedTimingProfileSchema } from '@pte-app/schemas';

// Validate incoming data
const result = QuestionContractSchema.safeParse(data);
if (result.success) {
  // result.data is a validated question shape
} else {
  console.error(result.error.issues);
}

// Validate timing profile
const timing = VersionedTimingProfileSchema.safeParse(timingData);
```

## Domain Model Creation

```typescript
import { createQuestion, questionHasTimeLimit } from '@pte-app/domain';
import type { QuestionContract } from '@pte-app/contracts';

const contract: QuestionContract = {/* ... */};
const question = createQuestion(contract);

if (questionHasTimeLimit(question)) {
  console.log(`Time limit: ${question.timeLimitSeconds}s`);
}
```

## Provenance Chains

```typescript
import { createProvenanceChain, appendToChain, filterEvents } from '@pte-app/provenance';
import type { AuditEventContract } from '@pte-app/contracts';

const chain = createProvenanceChain('q-1', 'question');
const updated = appendToChain(chain, auditEvent);

// Filter events
const filtered = filterEvents([auditEvent], { eventType: 'published' });
```
