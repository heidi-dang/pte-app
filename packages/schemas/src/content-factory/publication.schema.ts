import { z } from 'zod';
export const PublicationCommandSchema = z.object({
  id: z.string(),
  contentVersionId: z.string(),
  targetCatalogue: z.string(),
  effectiveDate: z.string(),
  idempotencyKey: z.string(),
  status: z.enum(['queued', 'published', 'failed']),
  publishedAt: z.string().optional(),
  rollbackState: z.string().optional(),
});
