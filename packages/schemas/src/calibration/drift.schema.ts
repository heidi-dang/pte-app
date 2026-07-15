import { z } from 'zod';
export const DriftEventSchema = z.object({
  id: z.string(),
  baselineProfileId: z.string(),
  baselineVersion: z.number().int(),
  candidateProfileId: z.string(),
  candidateVersion: z.number().int(),
  metricWindow: z.string(),
  thresholdProfile: z.string(),
  sampleSource: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  evidence: z.record(z.number()),
  status: z.enum(['detected', 'investigating', 'resolved', 'accepted']),
  alertSent: z.boolean(),
  resolvedAt: z.string().optional(),
  resolution: z.string().optional(),
});
