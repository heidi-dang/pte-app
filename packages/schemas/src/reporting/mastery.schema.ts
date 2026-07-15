import { z } from 'zod';

export const MasterySubjectSchema: z.ZodType<unknown> = z.discriminatedUnion('subjectType', [
  z.object({ subjectType: z.literal('skill'), subjectId: z.string(), subjectName: z.string() }),
  z.object({ subjectType: z.literal('task'), subjectId: z.string(), subjectName: z.string(), taskType: z.string() }),
]);

export const MasteryEvidenceSchema = z.object({
  attemptId: z.string(),
  resultId: z.string(),
  questionVersionId: z.string(),
  taskId: z.string(),
  taskType: z.string(),
  taskName: z.string(),
  skillId: z.string(),
  skillName: z.string(),
  estimatedTrainingScore: z.number(),
  confidence: z.number().min(0).max(1),
  scoringProfileId: z.string(),
  scoringProfileVersion: z.number().int().min(1),
  evaluationProfileId: z.string().nullable(),
  evaluationProfileVersion: z.number().int().nullable(),
  completenessStatus: z.enum(['complete', 'partial', 'failed']),
  timestamp: z.string(),
});

export const WeightedContributionSchema = z.object({
  evidence: MasteryEvidenceSchema,
  appliedWeight: z.number().min(0),
  weightedScore: z.number(),
  inclusionReason: z.enum([
    'complete-included',
    'partial-included',
    'partial-discounted',
    'failed-included-with-disclosure',
  ]),
});

export const ScoreNormalisationPolicySchema: z.ZodType<unknown> = z.discriminatedUnion('method', [
  z.object({ method: z.literal('none') }),
  z.object({
    method: z.literal('linear'),
    inputMinimum: z.number(),
    inputMaximum: z.number(),
    outputMinimum: z.number(),
    outputMaximum: z.number(),
  }),
  z.object({
    method: z.literal('z-score'),
    referenceMean: z.number(),
    referenceStandardDeviation: z.number().positive(),
  }),
]);

export const EvidencePolicySchema = z.object({
  completeResultPolicy: z.literal('include'),
  partialResultPolicy: z.enum(['include', 'discount', 'exclude']),
  partialResultWeight: z.number().min(0).max(1),
  failedResultPolicy: z.enum(['exclude', 'include-with-disclosure']),
  failedResultWeight: z.number().min(0).max(1),
  minimumEvidence: z.number().int().min(1),
  minimumConfidence: z.number().min(0).max(1),
  scoreNormalisationPolicy: ScoreNormalisationPolicySchema,
  confidenceWeightingPolicy: z.enum(['none', 'weighted']),
  referenceScoringProfileId: z.string().nullable(),
  referenceScoringProfileVersion: z.number().int().nullable(),
  referenceEvaluationProfileId: z.string().nullable(),
  referenceEvaluationProfileVersion: z.number().int().nullable(),
  allowedScoringProfileIds: z.array(z.string()),
  allowedScoringProfileVersions: z.array(z.number().int()),
  allowedEvaluationProfileIds: z.array(z.string()),
  allowedEvaluationProfileVersions: z.array(z.number().int()),
  mixedProfilePolicy: z.enum(['allow', 'exclude-mismatched', 'disclose-mismatched']),
});

export const MasteryLevelDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number().int().min(0),
  threshold: z.number().min(0).max(1),
});

export const ExcludedEvidenceSchema = z.object({
  evidence: MasteryEvidenceSchema,
  reason: z.enum([
    'partial-policy-excluded',
    'failed-policy-excluded',
    'invalid-profile-version',
    'incompatible-result-profile',
    'missing-required-field',
  ]),
});

const InsufficientLevelSchema = z.object({
  subject: MasterySubjectSchema,
  status: z.literal('insufficient'),
  level: z.null(),
  confidence: z.literal(0),
  evidenceCount: z.number().int().min(0),
  minimumRequired: z.number().int().min(1),
  lastUpdated: z.string(),
  contributingEvidence: z.array(WeightedContributionSchema),
  excludedEvidence: z.array(ExcludedEvidenceSchema),
  totalEvidence: z.number().int().min(0),
  eligibleEvidence: z.number().int().min(0),
  partialEvidence: z.number().int().min(0),
  failedEvidence: z.number().int().min(0),
  excludedEvidenceCount: z.number().int().min(0),
  warnings: z.array(z.string()),
});

const PartialSufficientLevelSchema = z.object({
  subject: MasterySubjectSchema,
  status: z.enum(['partial', 'sufficient']),
  level: z.number().int().min(0),
  confidence: z.number().min(0).max(1),
  evidenceCount: z.number().int().min(0),
  minimumRequired: z.number().int().min(1),
  lastUpdated: z.string(),
  contributingEvidence: z.array(WeightedContributionSchema),
  excludedEvidence: z.array(ExcludedEvidenceSchema),
  totalEvidence: z.number().int().min(0),
  eligibleEvidence: z.number().int().min(0),
  partialEvidence: z.number().int().min(0),
  failedEvidence: z.number().int().min(0),
  excludedEvidenceCount: z.number().int().min(0),
  warnings: z.array(z.string()),
});

export const MasteryLevelSchema: z.ZodType<unknown> = z.discriminatedUnion('status', [
  InsufficientLevelSchema,
  PartialSufficientLevelSchema,
]);

export const MasteryProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  evidencePolicy: EvidencePolicySchema,
  levelDefinitions: z.array(MasteryLevelDefinitionSchema),
  staleDataThresholdDays: z.number().int().min(1),
  fallbackLevel: z.number().int().min(0).nullable(),
});

export const MasterySnapshotSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  profileVersion: z.number().int().min(1),
  userId: z.string(),
  levels: z.array(MasteryLevelSchema),
  calculatedAt: z.string(),
  dataFreshness: z.enum(['fresh', 'stale', 'unknown']),
  partialData: z.boolean(),
  warnings: z.array(z.string()),
  masteryType: z.enum(['skill', 'task']),
});
