import { z } from 'zod';
export const IncidentSchema = z.object({
  id: z.string(),
  severity: z.enum(['minor', 'major', 'critical']),
  status: z.enum(['detected', 'investigating', 'mitigating', 'resolved', 'post-mortem']),
  affectedCapability: z.string(),
  startedAt: z.string(),
  identifiedAt: z.string().optional(),
  resolvedAt: z.string().optional(),
  userFacingUpdates: z.array(z.object({ message: z.string(), timestamp: z.string(), locale: z.string() })),
  internalUpdates: z.array(z.object({ message: z.string(), timestamp: z.string() })),
  impactSummary: z.string().optional(),
  remediation: z.string().optional(),
  postIncidentReference: z.string().optional(),
});
