import { z } from 'zod';
export const BiasAnalysisResultSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  profileVersion: z.number().int().min(1),
  subgroups: z.array(
    z.object({
      subgroupId: z.string(),
      subgroupName: z.string(),
      sampleSize: z.number().int(),
      meanScore: z.number(),
      confidence: z.number(),
      effectSize: z.number().optional(),
      baselineMean: z.number(),
      significant: z.boolean(),
      disclosed: z.boolean(),
    }),
  ),
  warnings: z.array(z.string()),
  minGroupSize: z.number().int(),
  privacySafe: z.boolean(),
  createdAt: z.string(),
});
