import { z } from 'zod';

export const ScoringProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  correctCredit: z.number(),
  incorrectDeduction: z.number(),
  minimumResult: z.number(),
  maximumResult: z.number(),
  rounding: z.object({
    method: z.enum(['none', 'floor', 'ceil', 'round']),
    decimalPlaces: z.number().int().min(0),
  }),
  normalisation: z.object({
    enabled: z.boolean(),
    method: z.enum(['none', 'linear', 'z-score']),
    referenceMean: z.number().optional(),
    referenceStdDev: z.number().optional(),
  }),
  noResponseBehaviour: z.object({
    result: z.number(),
    reason: z.enum(['profile-default', 'penalty', 'zero']),
  }),
});

export const ScoringInputSchema = z.object({
  questionVersionId: z.string(),
  taskType: z.string(),
  selectedAnswers: z.unknown(),
  correctAnswers: z.unknown(),
  context: z.record(z.unknown()).optional(),
});

export const ScoringEvidenceSchema = z.object({
  ruleType: z.string(),
  description: z.string(),
  contribution: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export const ScoringResultSchema = z.object({
  resultId: z.string(),
  attemptId: z.string(),
  questionVersionId: z.string(),
  scoringProfileId: z.string(),
  scoringProfileVersion: z.number().int().min(1),
  engineVersion: z.string(),
  rawResult: z.number(),
  boundedResult: z.number(),
  componentEvidence: z.array(ScoringEvidenceSchema),
  noResponse: z.boolean(),
  createdAt: z.string(),
  supersedesResultId: z.string().optional(),
  resultType: z.enum(['original', 'rescore']),
});

export const RescoreRequestSchema = z.object({
  originalResultId: z.string(),
  questionVersionId: z.string(),
  scoringProfileId: z.string(),
  scoringProfileVersion: z.number().int().min(1),
  reason: z.string().min(1),
});
