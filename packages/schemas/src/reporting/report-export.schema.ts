import { z } from 'zod';

export const ExportFormatSchema = z.enum(['csv', 'json', 'pdf']);

export const ExportRequestSchema = z.object({
  filter: z.object({
    dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
    taskTypes: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    modes: z.array(z.string()).optional(),
    profileVersions: z.array(z.number().int()).optional(),
    includePartial: z.boolean(),
    includeFailed: z.boolean(),
    aggregation: z.string().optional(),
  }),
  format: ExportFormatSchema,
  includeCharts: z.boolean(),
  includeRawData: z.boolean(),
});

export const ExportJobSchema = z.object({
  id: z.string(),
  userId: z.string(),
  request: ExportRequestSchema,
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  resultUrl: z.string().optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  failureReason: z.string().optional(),
});

export const ExportManifestSchema = z.object({
  id: z.string(),
  exportJobId: z.string(),
  format: ExportFormatSchema,
  rowCount: z.number().int().min(0),
  checksum: z.string(),
  artifactUrl: z.string(),
  generatedAt: z.string(),
  expiresAt: z.string(),
});
