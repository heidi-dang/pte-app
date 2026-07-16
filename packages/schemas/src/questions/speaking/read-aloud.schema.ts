import { z } from 'zod';
import { SpeakingCommonSchema } from './common.schema.js';

export const ReadAloudQuestionSchema = SpeakingCommonSchema.extend({
  type: z.literal('read_aloud'),
  passage: z.object({ text: z.string(), wordCount: z.number().int().min(1) }),
  showText: z.boolean(),
});

export const ReadAloudResponseSchema = z.object({
  recordingId: z.string(),
});
