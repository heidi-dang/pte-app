import { z } from 'zod';

export const AuditEventTypeSchema = z.enum([
  'created',
  'updated',
  'deleted',
  'published',
  'retired',
  'reviewed',
  'approved',
  'rejected',
  'accessed',
  'exported',
]);

export const AuditEventContractSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  eventType: AuditEventTypeSchema,
  actorId: z.string().min(1),
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  changes: z.record(z.unknown()),
  timestamp: z.string().datetime(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.record(z.unknown()),
});
