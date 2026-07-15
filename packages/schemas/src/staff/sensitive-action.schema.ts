import { z } from 'zod';
export const SensitiveActionConfirmationSchema = z.object({
  id: z.string(),
  actionType: z.string(),
  reason: z.string(),
  expectedTargetState: z.record(z.unknown()),
  idempotencyKey: z.string(),
  status: z.enum(['pending', 'confirmed', 'executed', 'stale-rejected']),
  auditEventId: z.string().optional(),
  expiresAt: z.string(),
  confirmedAt: z.string().optional(),
  confirmedById: z.string().optional(),
  createdAt: z.string(),
});
