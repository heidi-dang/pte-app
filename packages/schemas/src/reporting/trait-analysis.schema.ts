import { z } from 'zod';

export const TraitResultSchema = z.object({
  traitId: z.string(),
  traitName: z.string(),
  score: z.number(),
  confidence: z.number().min(0).max(1),
  sourceProfileVersion: z.number().int().min(1),
  sourceProviderId: z.string().optional(),
  evidenceType: z.enum(['human-reviewed', 'automated']),
  metadata: z.record(z.unknown()).optional(),
});

export const TraitAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskType: z.string().optional(),
  evaluationResultId: z.string(),
  traits: z.array(TraitResultSchema),
  missingTraits: z.array(z.string()),
  warnings: z.array(z.string()),
  createdAt: z.string(),
});
