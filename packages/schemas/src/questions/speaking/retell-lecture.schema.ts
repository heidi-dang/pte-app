import { z } from 'zod';
import { SpeakingCommonSchema } from './common.schema.js';

export const RetellLectureQuestionSchema = SpeakingCommonSchema.extend({
  type: z.literal('retell_lecture'),
  lectureAudioUrl: z.string().url().optional(),
  lectureNotes: z.array(z.string()),
  keyPoints: z.array(z.string()),
});

export const RetellLectureResponseSchema = z.object({
  recordingId: z.string(),
});
