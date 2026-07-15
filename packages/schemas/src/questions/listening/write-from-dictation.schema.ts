import { z } from 'zod';

export const WriteFromDictationQuestionSchema = z.object({
  type: z.literal('write_from_dictation'),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
  wordCount: z.number().int().min(1),
});

export const WriteFromDictationResponseSchema = z.object({
  words: z.string(),
});
