import { z } from 'zod';
export const AuditExportJobSchema = z.object({
  id: z.string(),
  filters: z.record(z.unknown()),
  requestedById: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  resultArtifactId: z.string().optional(),
  expiresAt: z.string().optional(),
  checksum: z.string().optional(),
  createdAt: z.string(),
});
