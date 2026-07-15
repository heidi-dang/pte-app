import { z } from 'zod';

export const DataFreshnessStatusSchema = z.enum(['fresh', 'stale', 'unknown']);

export const DataFreshnessSchema = z.object({
  status: DataFreshnessStatusSchema,
  lastUpdated: z.string(),
  staleThresholdMs: z.number().int().min(0),
  sourceDescription: z.string(),
  warning: z.string().optional(),
});
