import { z } from 'zod';

export const QuestionMediaReferenceSchema = z.object({
  mediaId: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
});

export const ScoringPrincipleSchema = z.object({
  criterion: z.string().min(1),
  weight: z.number().min(0).max(1),
  description: z.string().min(1),
});

export const QuestionContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  taskType: z.string().min(1),
  section: z.string().min(1),
  skillAssessed: z.string().min(1),
  prompt: z.string().min(1),
  media: z.array(QuestionMediaReferenceSchema),
  timeLimitSeconds: z.number().int().nullable(),
  preparationSeconds: z.number().int().nullable(),
  maximumAttempts: z.number().int().min(1),
  scoringPrinciples: z.array(ScoringPrincipleSchema),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
