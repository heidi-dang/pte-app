import { z } from 'zod';

export const HighlightIncorrectWordsQuestionSchema = z.object({
  type: z.literal('highlight_incorrect_words'),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
  transcript: z.string().min(1),
  wordCount: z.number().int().min(1),
  incorrectWordCount: z.number().int().min(1),
});

export const HighlightIncorrectWordsResponseSchema = z.object({
  flaggedWordIndices: z.array(z.number().int().min(0)),
});
