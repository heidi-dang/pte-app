import { z } from 'zod';

export const ProgressContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  userId: z.string().min(1),
  courseId: z.string().min(1),
  completedLessonIds: z.array(z.string()),
  attemptedTaskIds: z.array(z.string()),
  score: z.number().nullable(),
  completionPercentage: z.number().min(0).max(100),
  startedAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
  metadata: z.record(z.unknown()),
});
