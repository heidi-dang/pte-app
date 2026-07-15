import { z } from 'zod';
export const ExpertReviewSchema = z.object({
  id: z.string(),
  sampleId: z.string(),
  reviewerId: z.string(),
  traitScores: z.record(z.number()),
  overallScore: z.number(),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'adjudicated']),
  createdAt: z.string(),
});
