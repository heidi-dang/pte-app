import { z } from 'zod';
export const ReviewLockSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  ownerId: z.string(),
  acquiredAt: z.string(),
  expiresAt: z.string(),
  renewedAt: z.string().optional(),
  releasedAt: z.string().optional(),
  status: z.enum(['active', 'expired', 'released', 'taken-over']),
  takeoverHistory: z.array(z.object({ previousOwnerId: z.string(), newOwnerId: z.string(), timestamp: z.string() })),
});
