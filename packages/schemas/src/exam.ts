import { z } from 'zod';

export const ExamSectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  taskIds: z.array(z.string().min(1)).readonly(),
  timeLimitMinutes: z.number().int().min(1),
});

export const ExamContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  taskIds: z.array(z.string().min(1)).readonly(),
  timeLimitMinutes: z.number().int().min(1),
  sections: z.array(ExamSectionSchema).readonly(),
  scoringProfile: z.string().min(1),
  passingScore: z.number().min(0),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
