import { z } from 'zod';
export const CalibrationSampleSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  responseReference: z.string(),
  questionVersionId: z.string(),
  expectedTraitEvidence: z.array(z.object({ traitId: z.string(), expectedRange: z.tuple([z.number(), z.number()]) })),
  expectedResultRange: z.tuple([z.number(), z.number()]),
  expertIdentities: z.array(z.string()),
  agreementStatus: z.enum(['pending', 'agreed', 'disputed', 'adjudicated']),
  confidence: z.number().min(0).max(1),
  provenance: z.string(),
});
