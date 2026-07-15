import { z } from 'zod';

export const MockComparisonEntrySchema = z.object({
  mockSessionId: z.string(),
  blueprintId: z.string(),
  blueprintVersion: z.number().int().min(1),
  completedAt: z.string(),
  estimatedResult: z.number(),
  classification: z.string(),
  taskResults: z.array(
    z.object({
      taskType: z.string(),
      score: z.number(),
      maxScore: z.number(),
      partial: z.boolean(),
    }),
  ),
  compatible: z.boolean(),
  incompatibilityReason: z.string().optional(),
});

export const MockComparisonSchema = z.object({
  id: z.string(),
  userId: z.string(),
  entries: z.array(MockComparisonEntrySchema),
  warnings: z.array(z.string()),
  generatedAt: z.string(),
});
