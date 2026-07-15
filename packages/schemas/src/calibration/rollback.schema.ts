import { z } from 'zod';
export const ProfileRollbackDecisionSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  candidateVersion: z.number().int(),
  originalVersion: z.number().int(),
  reason: z.string(),
  affectedResultIds: z.array(z.string()),
  silentOverwrite: z.boolean(),
  decidedById: z.string(),
  decidedAt: z.string(),
});
