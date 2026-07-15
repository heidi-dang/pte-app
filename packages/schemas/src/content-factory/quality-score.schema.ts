import { z } from 'zod';
export const QualityProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  components: z.record(
    z.object({ weight: z.number().min(0), required: z.boolean(), threshold: z.number().min(0).max(1) }),
  ),
});
export const QualityScoreSchema = z.object({
  contentId: z.string(),
  profileId: z.string(),
  profileVersion: z.number().int().min(1),
  componentScores: z.record(z.number()),
  overallScore: z.number(),
  failedRequirements: z.array(z.string()),
  snapshotAt: z.string(),
});
