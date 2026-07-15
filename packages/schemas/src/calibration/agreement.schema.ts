import { z } from 'zod';
export const AgreementMetricsSchema = z.object({
  absoluteAgreement: z.number().min(0).max(1),
  toleranceAgreement: z.number().min(0).max(1),
  rankCorrelation: z.number().optional(),
  traitAgreement: z.record(z.number()),
  disagreementDistribution: z.record(z.number()),
  sampleCount: z.number().int().min(0),
  confidenceInterval: z.tuple([z.number(), z.number()]).optional(),
  missingData: z.boolean(),
  insufficientData: z.boolean(),
});
