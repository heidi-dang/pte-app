import { z } from 'zod';
import { SpeakingCommonSchema } from './common.schema.js';

export const RepeatSentenceQuestionSchema = SpeakingCommonSchema.extend({
  type: z.literal('repeat_sentence'),
  audioDurationMs: z.number().int().min(1),
  sentenceText: z.string(),
});

export const RepeatSentenceResponseSchema = z.object({
  recordingId: z.string(),
});
