import { z } from 'zod';

export const EvaluationRequestSchema = z.object({
  responseId: z.string(),
  questionVersionId: z.string(),
  taskType: z.string(),
  mediaReference: z.string().optional(),
  textReference: z.string().optional(),
  evaluationProfileVersion: z.number().int().min(1),
  scoringProfileId: z.string(),
  scoringProfileVersion: z.number().int().min(1),
  providerConfigReference: z.string(),
  correlationId: z.string(),
  idempotencyKey: z.string(),
});

export const ConfidenceInfoSchema = z.object({
  overallConfidence: z.number().min(0).max(1),
  transcriptionConfidence: z.number().min(0).max(1).optional(),
  evidenceConfidence: z.number().min(0).max(1).optional(),
});

export const EvaluationEvidenceSchema = z.object({
  traitType: z.string(),
  description: z.string(),
  score: z.number(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
});

export const EvaluationResultSchema = z.object({
  resultId: z.string(),
  requestCorrelationId: z.string(),
  providerId: z.string(),
  providerVersion: z.string(),
  evaluationProfileVersion: z.number().int().min(1),
  scoringProfileVersion: z.number().int().min(1),
  resultClassification: z.literal('estimated-training-result'),
  estimatedScore: z.number(),
  componentEvidence: z.array(EvaluationEvidenceSchema),
  confidence: ConfidenceInfoSchema,
  warnings: z.array(z.string()),
  limitations: z.array(z.string()),
  createdAt: z.string(),
});
