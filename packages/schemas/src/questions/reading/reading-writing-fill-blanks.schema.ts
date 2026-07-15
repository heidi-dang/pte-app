import { z } from 'zod';
import { ReadingPassageSchema } from './common.schema.js';

export const RwFillBlankOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const RwFillBlankGapSchema = z.object({
  index: z.number().int().min(0),
  options: z.array(RwFillBlankOptionSchema).min(2),
});

export const ReadingWritingFillBlanksQuestionSchema = z.object({
  type: z.literal('reading_writing_fill_blanks'),
  instructions: z.string().min(1),
  passage: ReadingPassageSchema,
  gaps: z.array(RwFillBlankGapSchema).min(1),
});

export const ReadingWritingFillBlanksResponseSchema = z.object({
  selections: z.record(z.string(), z.string()),
});
