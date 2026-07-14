import { z } from 'zod';

export const UploadStatusSchema = z.enum(['pending', 'uploading', 'processing', 'completed', 'failed']);

export const UploadContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  userId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(1),
  status: UploadStatusSchema,
  storageKey: z.string().min(1),
  checksum: z.string().min(1),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});
