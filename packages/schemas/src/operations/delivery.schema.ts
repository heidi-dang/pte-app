import { z } from 'zod';
export const DeliveryRecordSchema = z.object({
  id: z.string(),
  notificationId: z.string(),
  providerId: z.string(),
  status: z.enum(['queued', 'sent', 'delivered', 'bounced', 'failed']),
  providerMessageId: z.string().optional(),
  attemptedAt: z.string(),
  deliveredAt: z.string().optional(),
  error: z.string().optional(),
});
