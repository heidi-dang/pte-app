import { z } from 'zod';
export const CalibrationDatasetSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  taskType: z.string(),
  sampleReferences: z.array(z.string()),
  expertReviewStatus: z.enum(['pending', 'in-progress', 'completed']),
  provenance: z.string(),
  activationStatus: z.enum(['inactive', 'active', 'retired']),
  intendedUse: z.string(),
  exclusions: z.array(z.string()).optional(),
  subgroupMetadataPolicy: z.string(),
  createdById: z.string(),
  approvedById: z.string().optional(),
  createdAt: z.string(),
  activatedAt: z.string().optional(),
  immutable: z.boolean(),
});
