import { z } from 'zod';

export const SectionScoreSchema = z.object({
  sectionId: z.string().min(1),
  sectionName: z.string().min(1),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

export const ResultContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  attemptId: z.string().min(1),
  overallScore: z.number().min(0),
  maxScore: z.number().min(0),
  sectionScores: z.array(SectionScoreSchema).readonly(),
  passed: z.boolean(),
  scoredAt: z.string().datetime(),
  metadata: z.record(z.unknown()),
});
