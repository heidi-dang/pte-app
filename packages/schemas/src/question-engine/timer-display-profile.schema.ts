import { z } from 'zod';

export const TimerDisplayProfileSchema = z.object({
  refreshIntervalMs: z.number().int().min(100).max(5000),
  warningThresholdsMs: z.array(z.number().int().min(1000)).min(1),
});
