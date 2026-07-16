import { z } from 'zod';

export const ListeningFillBlankGapSchema = z.object({
  index: z.number().int().min(0),
  precedingWord: z.string().optional(),
  followingWord: z.string().optional(),
});

export const ListeningFillBlanksQuestionSchema = z.object({
  type: z.literal('listening_fill_blanks'),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
  transcript: z.string().min(1),
  gaps: z.array(ListeningFillBlankGapSchema).min(1),
});

export const ListeningFillBlanksResponseSchema = z.object({
  placements: z.record(z.string(), z.string().nullable()),
});
