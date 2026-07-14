import { z } from 'zod';

export const AnswerResponseSchema = z.object({
  type: z.enum(['text', 'audio', 'file', 'selection']),
  value: z.string().nullable(),
  filePath: z.string().nullable(),
  selectionIndices: z.array(z.number().int()).nullable(),
});

export const AnswerContractSchema = z.object({
  attemptId: z.string().min(1),
  version: z.string().min(1),
  questionId: z.string().min(1),
  response: AnswerResponseSchema,
  submittedAt: z.string().datetime(),
  durationMs: z.number().int().min(0),
  metadata: z.record(z.unknown()),
});
