import { z } from 'zod';

export const ReportFilterSchema = z.object({
  dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
  taskTypes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  modes: z.array(z.string()).optional(),
  profileVersions: z.array(z.number().int()).optional(),
  includePartial: z.boolean(),
  includeFailed: z.boolean(),
  aggregation: z.string().optional(),
});
