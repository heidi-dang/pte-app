// @pte-app/db — Public API
//
// This package exposes:
//   1. A singleton PrismaClient (for server-side use only)
//   2. Typed repository factory functions
//   3. All Prisma types re-exported for consumers

export { prisma, default as db } from './client.js';

export { createUsersRepository } from './repositories/users.js';
export type { CreateUserInput, CreateProfileInput, CreateEmailVerificationInput } from './repositories/users.js';

export { createSessionsRepository } from './repositories/sessions.js';
export type { CreateSessionInput } from './repositories/sessions.js';

export { createContentRepository } from './repositories/content.js';
export type { CreateQuestionVersionInput, SubmitReviewInput } from './repositories/content.js';

export { createAttemptsRepository } from './repositories/attempts.js';
export type { SubmitResponseInput } from './repositories/attempts.js';

export { createScoringRepository } from './repositories/scoring.js';
export type { CreateScoringResultInput, CompleteScoringResultInput } from './repositories/scoring.js';

export { createStudyPlansRepository } from './repositories/study-plans.js';
export type { GenerateStudyPlanInput } from './repositories/study-plans.js';

export { createSubscriptionsRepository } from './repositories/subscriptions.js';
export type { CreateSubscriptionInput } from './repositories/subscriptions.js';

export { createAuditRepository } from './repositories/audit.js';
export type { AppendAuditLogInput } from './repositories/audit.js';

// Re-export Prisma types and enums for consumers
export {
  PrismaClient,
  Prisma,
  RoleName,
  SubscriptionStatus,
  QuestionStatus,
  ReviewOutcome,
  AttemptType,
  AttemptStatus,
  ScoringStatus,
  ScoringMethod,
  JobStatus,
  AuditAction,
} from '@prisma/client';
