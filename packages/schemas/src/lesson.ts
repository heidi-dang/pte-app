import { z } from 'zod';

export const LessonContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  order: z.number().int().min(0),
  taskIds: z.array(z.string().min(1)).readonly(),
  estimatedMinutes: z.number().int().min(1),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
