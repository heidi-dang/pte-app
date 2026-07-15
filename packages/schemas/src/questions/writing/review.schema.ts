import { z } from 'zod';

export const ReviewDataSchema = z.object({
  wordCount: z.number().int().min(0),
  charCount: z.number().int().min(0),
  meetsMinimumWords: z.boolean(),
  exceedsMaximumWords: z.boolean(),
});
