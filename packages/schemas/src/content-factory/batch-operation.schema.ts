import { z } from 'zod';
export const BatchOperationSchema = z.object({
  id: z.string(),
  operationType: z.string(),
  contentIds: z.array(z.string()),
  status: z.enum(['preview', 'validating', 'ready', 'running', 'partial', 'completed', 'failed', 'cancelled']),
  dryRun: z.boolean(),
  results: z.array(z.object({ contentId: z.string(), success: z.boolean(), error: z.string().optional() })),
  idempotencyKey: z.string(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});
