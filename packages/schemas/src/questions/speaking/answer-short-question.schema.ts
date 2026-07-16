import { z } from 'zod';
import { SpeakingCommonSchema } from './common.schema.js';

export const AnswerShortQuestionSchema = SpeakingCommonSchema.extend({
  type: z.literal('answer_short_question'),
  questionText: z.string(),
  expectedAnswerKeywords: z.array(z.string()),
});

export const AnswerShortQuestionResponseSchema = z.object({
  recordingId: z.string(),
});
