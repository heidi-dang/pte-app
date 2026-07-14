import { z } from 'zod';

export const FeedbackTypeSchema = z.enum(['scoring', 'coaching', 'diagnostic', 'system']);

export const FeedbackContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  attemptId: z.string().min(1),
  type: FeedbackTypeSchema,
  content: z.string().min(1),
  criterion: z.string().nullable(),
  score: z.number().nullable(),
  generatedBy: z.string().min(1),
  createdAt: z.string().datetime(),
  metadata: z.record(z.unknown()),
});
