import { z } from 'zod';

export const QuestionIdSchema = z.string();
export const QuestionVersionIdSchema = z.string();
export const QuestionSessionIdSchema = z.string();
export const QuestionResponseIdSchema = z.string();
export const QuestionSubmissionIdSchema = z.string();
export const QuestionEventIdSchema = z.string();
export const PlaybackRightIdSchema = z.string();
export const TimingProfileIdSchema = z.string();
export const PlaybackProfileIdSchema = z.string();
export const ScoringProfileIdSchema = z.string();
export const IdempotencyKeySchema = z.string();
export const ResponseRevisionSchema = z.number().int();
export const EventSequenceSchema = z.number().int().nonnegative();
