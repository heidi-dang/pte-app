import { z } from 'zod';
import { ReadingPassageSchema } from './common.schema.js';

export const ReadingFillBlankTokenSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const ReadingFillBlankGapSchema = z.object({
  index: z.number().int().min(0),
});

export const ReadingFillBlanksQuestionSchema = z.object({
  type: z.literal('reading_fill_blanks'),
  instructions: z.string().min(1),
  passage: ReadingPassageSchema,
  tokens: z.array(ReadingFillBlankTokenSchema).min(1),
  gaps: z.array(ReadingFillBlankGapSchema).min(1),
});

export const ReadingFillBlanksResponseSchema = z.object({
  placements: z.record(z.string(), z.string().nullable()),
});
