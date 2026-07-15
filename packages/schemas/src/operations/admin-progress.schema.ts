import { z } from 'zod';
export const AdministrativeProgressSchema = z.object({
  id: z.string(),
  jobType: z.string(),
  currentStage: z.string(),
  percentage: z.number().min(0).max(100),
  completedItems: z.number().int().min(0),
  failedItems: z.number().int().min(0),
  totalItems: z.number().int().min(0),
  retryState: z.enum(['idle', 'retrying', 'max-retries-reached']),
  correlationId: z.string(),
  lastUpdated: z.string(),
  stale: z.boolean(),
});
