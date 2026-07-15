import { z } from 'zod';
export const ContentRetirementSchema = z.object({
  id: z.string(),
  contentVersionId: z.string(),
  reason: z.string(),
  replacementContentId: z.string().optional(),
  status: z.enum(['active', 'retired']),
  retiredAt: z.string().optional(),
  retiredById: z.string().optional(),
});
