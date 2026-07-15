import { z } from 'zod';

const DuplicationActionSchema = z.enum(['reject', 'deduplicate', 'allow']);

const BinaryParamsSchema = z.object({
  kind: z.literal('binary'),
  correctCredit: z.number(),
  incorrectDeduction: z.number(),
  duplicateAction: DuplicationActionSchema,
});

const MultipleAnswerParamsSchema = z.object({
  kind: z.literal('multiple-answer'),
  correctCredit: z.number(),
  incorrectDeduction: z.number(),
  duplicateAction: DuplicationActionSchema,
});

const PerBlankParamsSchema = z.object({
  kind: z.literal('per-blank'),
  blankCredit: z.number(),
  casePolicy: z.enum(['insensitive', 'sensitive']),
  whitespacePolicy: z.enum(['collapse', 'preserve']),
});

const PerWordParamsSchema = z.object({
  kind: z.literal('per-word'),
  wordCredit: z.number(),
  casePolicy: z.enum(['insensitive', 'sensitive']),
  punctuationPolicy: z.enum(['strip', 'preserve']),
});

const AdjacentPairParamsSchema = z.object({
  kind: z.literal('adjacent-pair'),
  correctCredit: z.number(),
});

export const ScoringRuleParamsSchema = z.discriminatedUnion('kind', [
  BinaryParamsSchema,
  MultipleAnswerParamsSchema,
  PerBlankParamsSchema,
  PerWordParamsSchema,
  AdjacentPairParamsSchema,
]);

export const ScoringRuleDefinitionSchema = z.object({
  ruleType: z.enum([
    'binary-correct-incorrect',
    'multiple-answer-negative-marking',
    'per-blank',
    'per-word',
    'adjacent-pair',
  ]),
  params: ScoringRuleParamsSchema,
});

export const ScoringProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  rules: z.array(ScoringRuleDefinitionSchema).min(1),
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
  minimumResult: z.number(),
  maximumResult: z.number(),
  rounding: z.object({
    method: z.enum(['none', 'floor', 'ceil', 'round']),
    decimalPlaces: z.number().int().min(0),
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
