import { z } from 'zod';

export const ScoreTrendPointSchema = z.object({
  timestamp: z.string(),
  value: z.number(),
  sourceResultId: z.string(),
  profileId: z.string(),
  profileVersion: z.number().int().min(1),
  partial: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
});

export const ScoreTrendConfigSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  timeGrouping: z.enum(['day', 'week', 'month', 'quarter']),
  aggregationMethod: z.enum(['mean', 'median', 'latest']),
  minimumDataPoints: z.number().int().min(1),
  includePartial: z.boolean(),
  profileChangePolicy: z.enum(['flag', 'split', 'exclude']),
  staleDataThresholdDays: z.number().int().min(1),
});

export const ScoreTrendSetSchema = z.object({
  config: ScoreTrendConfigSchema,
  dataPoints: z.array(ScoreTrendPointSchema),
  profileChanges: z.array(
    z.object({
      fromVersion: z.number().int(),
      toVersion: z.number().int(),
      effectiveAt: z.string(),
    }),
  ),
  warnings: z.array(z.string()),
});
