import { z } from 'zod';

export const ReorderParagraphItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const ReorderParagraphQuestionSchema = z.object({
  type: z.literal('reorder_paragraph'),
  instructions: z.string().min(1),
  items: z.array(ReorderParagraphItemSchema).min(2),
});

export const ReorderParagraphResponseSchema = z.object({
  orderedIds: z.array(z.string()),
});
