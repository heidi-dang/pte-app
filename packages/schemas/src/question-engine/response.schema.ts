import { z } from 'zod';

export const ResponseStateSchema = z.enum(['empty', 'incomplete', 'complete', 'submitted']);

export const QuestionResponseEnvelopeSchema = z.object({
  sessionId: z.string(),
  questionVersionId: z.string(),
  questionType: z.string(),
  revision: z.number().int(),
  state: ResponseStateSchema,
  response: z.unknown(),
  updatedAt: z.string().datetime(),
});
