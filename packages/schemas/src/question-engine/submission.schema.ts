import { z } from 'zod';

export const SubmissionStatusSchema = z.enum(['accepted', 'rejected', 'duplicate']);

export const SubmissionResultSchema = z.object({
  submissionId: z.string(),
  sessionId: z.string(),
  questionVersionId: z.string(),
  status: SubmissionStatusSchema,
  idempotencyKey: z.string(),
  submittedAt: z.string().datetime(),
});
