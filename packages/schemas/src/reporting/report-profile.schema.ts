import { z } from 'zod';
import { MasteryProfileSchema } from './mastery.schema.js';
import { ScoreTrendConfigSchema } from './score-trend.schema.js';

export const ReportProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  aggregationWindow: z.number().int().min(1),
  masteryPolicy: MasteryProfileSchema,
  scoreTrendPolicy: ScoreTrendConfigSchema,
  partialDataPolicy: z.enum(['include', 'exclude', 'flag']),
  staleDataPolicy: z.enum(['flag', 'exclude']),
  traitAggregationPolicy: z.enum(['latest', 'mean', 'median']),
  comparisonPolicy: z.enum(['compatible-only', 'all-with-warning']),
  exportPolicy: z.object({
    allowedFormats: z.array(z.string()),
    maxExportRows: z.number().int().min(1),
  }),
});
