import { z } from 'zod';
export const ImportJobSchema = z.object({
  id: z.string(),
  sourceType: z.enum(['csv', 'json', 'xml', 'api']),
  sourceReference: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  itemCount: z.number().int().min(0),
  successCount: z.number().int().min(0),
  failureCount: z.number().int().min(0),
  errors: z.array(z.object({ item: z.number().int(), message: z.string() })),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});
