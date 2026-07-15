import { z } from 'zod';
export const AuditQuerySchema = z.object({
  filters: z.object({
    actorIds: z.array(z.string()).optional(),
    actionTypes: z.array(z.string()).optional(),
    dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
    resourceTypes: z.array(z.string()).optional(),
  }),
  limit: z.number().int().min(1).max(1000),
  offset: z.number().int().min(0),
});
export const AuditViewEntrySchema = z.object({
  id: z.string(),
  actionType: z.string(),
  actorId: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  details: z.record(z.unknown()),
  timestamp: z.string(),
});
