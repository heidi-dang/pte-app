import { z } from 'zod';

export const AttemptReferenceSchema = z.object({
  resultId: z.string(),
  questionVersionId: z.string(),
  taskType: z.string(),
  completedAt: z.string(),
  estimatedScore: z.number(),
});

export const MasteryLevelSchema = z.object({
  skillId: z.string(),
  skillName: z.string(),
  level: z.number().int().min(0),
  confidence: z.number().min(0).max(1),
  evidenceCount: z.number().int().min(0),
  minimumRequired: z.number().int().min(1),
  status: z.enum(['sufficient', 'insufficient', 'partial']),
  lastUpdated: z.string(),
  contributingAttempts: z.array(AttemptReferenceSchema),
});

export const MasteryProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  minimumEvidence: z.number().int().min(1),
  minimumConfidence: z.number().min(0).max(1),
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
