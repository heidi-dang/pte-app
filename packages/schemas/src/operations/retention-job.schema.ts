import { z } from 'zod';
export const RetentionJobSchema = z.object({
  id: z.string(),
  policyVersion: z.number().int(),
  targetDataClass: z.string(),
  eligibilityCount: z.number().int().min(0),
  preview: z.boolean(),
  dryRun: z.boolean(),
  excludedIds: z.array(z.string()),
  legalHoldIds: z.array(z.string()),
  status: z.enum(['preview', 'running', 'completed', 'failed', 'cancelled']),
  deletedCount: z.number().int().optional(),
  failureReason: z.string().optional(),
  createdAt: z.string(),
});
