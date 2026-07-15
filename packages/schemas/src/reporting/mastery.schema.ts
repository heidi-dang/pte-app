import { z } from 'zod';

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

export const EvidencePolicySchema = z.object({
  completeResultPolicy: z.literal('include'),
  partialResultPolicy: z.enum(['include', 'discount', 'exclude']),
  failedResultPolicy: z.enum(['exclude', 'include-with-disclosure']),
  minimumEvidence: z.number().int().min(1),
  minimumConfidence: z.number().min(0).max(1),
  scoreNormalisationPolicy: z.enum(['none', 'z-score', 'linear']),
  confidenceWeightingPolicy: z.enum(['none', 'weighted']),
});

export const MasteryLevelSchema: z.ZodType<unknown> = z.discriminatedUnion('status', [
  z.object({
    skillId: z.string(),
    skillName: z.string(),
    status: z.literal('insufficient'),
    level: z.null(),
    confidence: z.literal(0),
    evidenceCount: z.number().int().min(0),
    minimumRequired: z.number().int().min(1),
    lastUpdated: z.string(),
    contributingAttempts: z.array(MasteryEvidenceSchema),
    totalEvidence: z.number().int().min(0),
    eligibleEvidence: z.number().int().min(0),
    partialEvidence: z.number().int().min(0),
    failedEvidence: z.number().int().min(0),
    excludedEvidence: z.number().int().min(0),
  }),
  z.object({
    skillId: z.string(),
    skillName: z.string(),
    status: z.enum(['partial', 'sufficient']),
    level: z.number().int().min(0),
    confidence: z.number().min(0).max(1),
    evidenceCount: z.number().int().min(0),
    minimumRequired: z.number().int().min(1),
    lastUpdated: z.string(),
    contributingAttempts: z.array(MasteryEvidenceSchema),
    totalEvidence: z.number().int().min(0),
    eligibleEvidence: z.number().int().min(0),
    partialEvidence: z.number().int().min(0),
    failedEvidence: z.number().int().min(0),
    excludedEvidence: z.number().int().min(0),
  }),
]);

export const MasteryProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  evidencePolicy: EvidencePolicySchema,
  levelDefinitions: z.record(
    z.object({
      threshold: z.number().min(0).max(1),
      label: z.string(),
    }),
  ),
  staleDataThresholdDays: z.number().int().min(1),
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
});
