import { z } from 'zod';

export const ReadingPassageSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  wordCount: z.number().int().min(0),
});

export const ReadingCommonContractSchema = z.object({
  type: z.string().min(1),
  instructions: z.string().min(1),
  passage: ReadingPassageSchema.optional(),
});
