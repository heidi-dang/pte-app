import { z } from 'zod';

export const WritingCommonSchema = z.object({
  type: z.string(),
  instructions: z.string(),
  maxWords: z.number().int().min(1),
  minWords: z.number().int().min(0),
});
