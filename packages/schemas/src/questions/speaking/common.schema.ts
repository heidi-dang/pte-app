import { z } from 'zod';

export const SpeakingCommonSchema = z.object({
  type: z.string(),
  instructions: z.string(),
  preparationTimeSeconds: z.number().int().min(0),
  recordingTimeSeconds: z.number().int().min(1),
  allowsRetake: z.boolean(),
  audioProfileId: z.string().optional(),
});
