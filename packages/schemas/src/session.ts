import { z } from 'zod';

export const SessionStatusSchema = z.enum(['pending', 'active', 'paused', 'completed', 'expired', 'abandoned']);

export const SessionContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  examId: z.string().min(1),
  userId: z.string().min(1),
  status: SessionStatusSchema,
  startedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  currentTaskIndex: z.number().int().min(0),
  answers: z.array(z.string()).readonly(),
  metadata: z.record(z.unknown()),
});
