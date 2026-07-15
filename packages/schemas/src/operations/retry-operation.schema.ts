import { z } from 'zod';
export const RetryOperationSchema = z.object({
  id: z.string(),
  originalJobId: z.string(),
  originalPayloadReference: z.string(),
  failureReason: z.string(),
  retryPolicy: z.string(),
  retryCount: z.number().int().min(0),
  nextAllowedRetry: z.string().optional(),
  idempotencyKey: z.string(),
  replacementJobId: z.string().optional(),
  originalJobPreserved: z.boolean(),
  status: z.enum(['requested', 'executing', 'completed', 'failed']),
  createdAt: z.string(),
});
