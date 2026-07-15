import { z } from 'zod';
export const ValidationRunSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  version: z.number().int(),
  checks: z.array(z.object({ name: z.string(), passed: z.boolean(), message: z.string().optional() })),
  status: z.enum(['queued', 'running', 'passed', 'failed']),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});
