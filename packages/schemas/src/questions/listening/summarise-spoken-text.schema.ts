import { z } from 'zod';

export const SummariseSpokenTextQuestionSchema = z.object({
  type: z.literal('summarise_spoken_text'),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
  minWords: z.number().int().min(1),
  maxWords: z.number().int().min(1),
});

export const SummariseSpokenTextResponseSchema = z.object({
  summary: z.string(),
  wordCount: z.number().int().min(0),
});
