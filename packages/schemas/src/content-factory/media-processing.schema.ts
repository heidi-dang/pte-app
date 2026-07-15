import { z } from 'zod';
export const MediaProcessingJobSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  sourceMediaId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'retrying']),
  progress: z.number().min(0).max(100),
  outputMediaId: z.string().optional(),
  integrityReference: z.string().optional(),
  transcriptMediaRelationship: z.string().optional(),
  originalPreserved: z.boolean(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  failureReason: z.string().optional(),
});
