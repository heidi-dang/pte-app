import { z } from 'zod';
import { SpeakingCommonSchema } from './common.schema.js';

export const DescribeImageQuestionSchema = SpeakingCommonSchema.extend({
  type: z.literal('describe_image'),
  imageUrl: z.string().url(),
  imageDescription: z.string(),
  promptText: z.string(),
});

export const DescribeImageResponseSchema = z.object({
  recordingId: z.string(),
});
