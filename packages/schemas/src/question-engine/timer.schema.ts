import { z } from 'zod';

export const TimerStateSchema = z.object({
  timingProfileId: z.string(),
  serverDeadline: z.string().datetime(),
  serverNowAtCreation: z.string().datetime(),
  remainingMilliseconds: z.number().int(),
  isExpired: z.boolean(),
  warningThresholdReached: z.boolean(),
});
