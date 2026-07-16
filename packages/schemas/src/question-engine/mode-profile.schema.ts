import { z } from 'zod';

export const SessionModeCapabilitiesSchema = z.object({
  canPause: z.boolean(),
  showsFeedback: z.boolean(),
  showsCorrectAnswer: z.boolean(),
  usesServerDeadline: z.boolean(),
  allowsReview: z.boolean(),
  allowsPlayback: z.boolean(),
  allowsAutosave: z.boolean(),
  allowsEmptySubmission: z.boolean(),
});

export const QuestionSessionModeProfileSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().min(1),
  mode: z.enum(['learning', 'review', 'timed-practice', 'section-test', 'mock']),
  capabilities: SessionModeCapabilitiesSchema,
  timingProfileId: z.string().optional(),
  playbackProfileId: z.string().optional(),
  scoringProfileId: z.string().optional(),
});
