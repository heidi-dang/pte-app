import { z } from 'zod';

export const WeaknessReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  weaknesses: z.array(
    z.object({
      skillId: z.string(),
      skillName: z.string(),
      score: z.number(),
      gap: z.number(),
      priority: z.enum(['high', 'medium', 'low']),
      evidence: z.string(),
      reason: z.string(),
    }),
  ),
  insufficientEvidence: z.boolean(),
  createdAt: z.string(),
  profileVersion: z.number().int(),
  reportVersion: z.number().int(),
});
