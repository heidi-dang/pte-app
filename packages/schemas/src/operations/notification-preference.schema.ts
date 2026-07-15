import { z } from 'zod';
export const NotificationPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  channel: z.enum(['email', 'in-app', 'sms']),
  category: z.string(),
  enabled: z.boolean(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  locale: z.string(),
  digestPolicy: z.enum(['immediate', 'daily', 'weekly']),
  version: z.number().int(),
  effectiveDate: z.string(),
  mandatory: z.boolean(),
});
