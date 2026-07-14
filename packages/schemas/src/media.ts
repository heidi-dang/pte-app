import { z } from 'zod';

export const MediaTypeSchema = z.enum(['audio', 'video', 'image', 'document']);

export const MediaContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  type: MediaTypeSchema,
  url: z.string().url(),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(1),
  durationSeconds: z.number().nullable(),
  language: z.string().min(1),
  checksum: z.string().min(1),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
