import { z } from 'zod';

export const CourseContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  lessonIds: z.array(z.string().min(1)).readonly(),
  difficulty: z.string().min(1),
  estimatedMinutes: z.number().int().min(1),
  tags: z.array(z.string()).readonly(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
