import { z } from 'zod';
export const ProfileComparisonSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  baselineProfile: z.object({ id: z.string(), version: z.number().int() }),
  candidateProfile: z.object({ id: z.string(), version: z.number().int() }),
  overallDelta: z.number(),
  traitDeltas: z.record(z.number()),
  regressions: z.array(z.string()),
  improvements: z.array(z.string()),
  inconclusive: z.boolean(),
  confidence: z.number(),
  createdAt: z.string(),
});
