import { z } from 'zod';

export const QuestionAttemptStatusSchema = z.enum([
  'created',
  'in_progress',
  'autosaved',
  'submitted',
  'reviewable',
  'expired',
  'interrupted',
  'recovered',
]);

export const QuestionAttemptModeSchema = z.enum(['learning', 'review', 'timed', 'mock']);

export const QuestionAttemptRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  questionId: z.string().min(1),
  lessonId: z.string().min(1),
  sessionId: z.string().min(1),
  status: QuestionAttemptStatusSchema,
  mode: QuestionAttemptModeSchema,
  versionSnapshotId: z.string().nullable(),
  response: z.record(z.unknown()).nullable(),
  startedAt: z.string().datetime(),
  lastAutosavedAt: z.string().datetime().nullable(),
  submittedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  timeLimitSeconds: z.number().int().positive().nullable(),
  idempotencyKey: z.string().nullable(),
  playCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const QuestionSessionRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  lessonId: z.string().min(1),
  mode: QuestionAttemptModeSchema,
  status: z.enum(['active', 'paused', 'completed', 'expired', 'recovered']),
  currentAttemptId: z.string().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PlaybackConsumptionRecordSchema = z.object({
  id: z.string().min(1),
  attemptId: z.string().min(1),
  userId: z.string().min(1),
  mediaId: z.string().min(1),
  playCount: z.number().int().min(0),
  maxPlays: z.number().int().min(0),
  firstPlayedAt: z.string().datetime().nullable(),
  lastPlayedAt: z.string().datetime().nullable(),
  consumedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const QuestionResponseEnvelopeSchema = z.object({
  attemptId: z.string().min(1),
  status: QuestionAttemptStatusSchema,
  response: z.record(z.unknown()).nullable(),
  mode: QuestionAttemptModeSchema,
  startedAt: z.string().datetime(),
  lastAutosavedAt: z.string().datetime().nullable(),
  submittedAt: z.string().datetime().nullable(),
  timeLimitSeconds: z.number().int().positive().nullable(),
  serverNow: z.string().datetime(),
  remainingSeconds: z.number().int().nullable(),
  playback: z.array(PlaybackConsumptionRecordSchema).nullable(),
});

export const TimerPolicySchema = z.object({
  serverAuthoritative: z.boolean(),
  enforceTimeLimit: z.boolean(),
  graceSeconds: z.number().int().min(0),
  warnAtSeconds: z.number().int().positive().nullable(),
});

export const PlaybackPolicySchema = z.object({
  maxPlays: z.number().int().min(1),
  consumeOnFirstPlay: z.boolean(),
  reconnectResetsConsumed: z.boolean(),
  policyId: z.string().min(1),
});

export const ReviewVisibilityPolicySchema = z.object({
  showQuestionPrompt: z.boolean(),
  showUserResponse: z.boolean(),
  showCorrectAnswer: z.boolean(),
  showScore: z.boolean(),
  showFeedback: z.boolean(),
  allowAnswerMutation: z.boolean(),
});

export const AccessibilityContractSchema = z.object({
  supportsScreenReader: z.boolean(),
  supportsKeyboardNavigation: z.boolean(),
  supportsFontScaling: z.boolean(),
  supportsReducedMotion: z.boolean(),
  supportsHighContrast: z.boolean(),
});

export const ProgressEventContractSchema = z.object({
  onStart: z.string().min(1),
  onProgress: z.string().min(1),
  onAutosave: z.string().min(1),
  onSubmit: z.string().min(1),
  onTimeout: z.string().min(1),
  onError: z.string().min(1),
});

export const RendererContractSchema = z.object({
  taskType: z.string().min(1),
  responseSchema: z.record(z.unknown()),
  emptyResponseFactory: z.function(),
  validateResponse: z.function(),
  normalizeResponse: z.function(),
  scoringAdapter: z.function(),
  timerPolicy: TimerPolicySchema,
  playbackPolicy: PlaybackPolicySchema.optional(),
  reviewVisibilityPolicy: ReviewVisibilityPolicySchema,
  accessibility: AccessibilityContractSchema,
  progressEventContract: ProgressEventContractSchema,
});

export const StartSessionRequestSchema = z.object({
  lessonId: z.string().min(1),
  mode: QuestionAttemptModeSchema,
  questionIds: z.array(z.string().min(1)).min(1),
  questionTaskTypes: z.record(z.string().min(1)).optional(),
});

export const PlaybackRecordRequestSchema = z.object({
  attemptId: z.string().min(1),
  mediaId: z.string().min(1),
  maxPlays: z.number().int().min(1).default(1),
});

export const AutosaveRequestSchema = z.object({
  attemptId: z.string().min(1),
  response: z.record(z.unknown()),
  idempotencyKey: z.string().optional(),
});

export const SubmitRequestSchema = z.object({
  attemptId: z.string().min(1),
  response: z.record(z.unknown()),
  idempotencyKey: z.string().min(1),
});

export const ValidTransitionSchema = z.function();
