import { z } from 'zod';
export const ImpersonationSessionSchema = z.object({
  id: z.string(),
  impersonatorId: z.string(),
  targetUserId: z.string(),
  reason: z.string(),
  startedAt: z.string(),
  expiresAt: z.string(),
  endedAt: z.string().optional(),
  status: z.enum(['active', 'expired', 'ended']),
  auditEvents: z.array(z.object({ event: z.string(), timestamp: z.string() })),
});
