import { z } from 'zod';

export const AttemptStatusSchema = z.enum(['in_progress', 'submitted', 'scored', 'reviewed', 'voided']);

export const QuestionResponseSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().nullable(),
  score: z.number().nullable(),
  durationMs: z.number().int().min(0),
});

export const AttemptContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  userId: z.string().min(1),
  examId: z.string().min(1),
  sessionId: z.string().min(1),
  status: AttemptStatusSchema,
  questionResponses: z.array(QuestionResponseSchema),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  totalScore: z.number().nullable(),
  metadata: z.record(z.unknown()),
});
