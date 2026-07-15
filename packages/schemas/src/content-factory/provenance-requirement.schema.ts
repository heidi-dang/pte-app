import { z } from 'zod';
export const ContentProvenanceRecordSchema = z.object({
  id: z.string(),
  contentVersionId: z.string(),
  sourceType: z.enum(['original', 'imported', 'generated', 'adapted']),
  sourceReference: z.string().optional(),
  licenceStatus: z.enum(['valid', 'expired', 'unknown']),
  creatorDeclaration: z.string(),
  reviewerConfirmation: z.boolean(),
  createdAt: z.string(),
});
export const ProvenanceGateResultSchema = z.object({
  passed: z.boolean(),
  blocks: z.array(z.object({ reason: z.string(), field: z.string() })),
  warnings: z.array(z.string()),
});
