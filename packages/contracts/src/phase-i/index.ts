import type {
  QuestionAttemptId,
  QuestionSessionId,
  QuestionVersionSnapshotId,
  PlaybackConsumptionId,
  IdempotencyKey,
  QuestionId,
  UserId,
  LessonId,
  ISO8601DateTime,
  JsonObject,
} from '@pte-app/types';

// ─── Branded IDs ──────────────────────────────────────────────

export type { QuestionAttemptId, QuestionSessionId, QuestionVersionSnapshotId, PlaybackConsumptionId, IdempotencyKey };

// ─── Status & Mode enum types ─────────────────────────────────

export type QuestionAttemptStatus =
  'created' | 'in_progress' | 'autosaved' | 'submitted' | 'reviewable' | 'expired' | 'interrupted' | 'recovered';

export type QuestionAttemptMode = 'learning' | 'review' | 'timed' | 'mock';

// ─── Question Attempt ─────────────────────────────────────────

export interface QuestionAttemptRecord {
  readonly id: QuestionAttemptId;
  readonly userId: UserId;
  readonly questionId: QuestionId;
  readonly lessonId: LessonId;
  readonly sessionId: QuestionSessionId;
  readonly status: QuestionAttemptStatus;
  readonly mode: QuestionAttemptMode;
  readonly versionSnapshotId: QuestionVersionSnapshotId | null;
  readonly response: JsonObject | null;
  readonly startedAt: ISO8601DateTime;
  readonly lastAutosavedAt: ISO8601DateTime | null;
  readonly submittedAt: ISO8601DateTime | null;
  readonly expiresAt: ISO8601DateTime | null;
  readonly timeLimitSeconds: number | null;
  readonly idempotencyKey: IdempotencyKey | null;
  readonly playCount: number;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

// ─── Question Session ─────────────────────────────────────────

export interface QuestionSessionRecord {
  readonly id: QuestionSessionId;
  readonly userId: UserId;
  readonly lessonId: LessonId;
  readonly mode: QuestionAttemptMode;
  readonly status: 'active' | 'paused' | 'completed' | 'expired' | 'recovered';
  readonly currentAttemptId: QuestionAttemptId | null;
  readonly startedAt: ISO8601DateTime;
  readonly completedAt: ISO8601DateTime | null;
  readonly expiresAt: ISO8601DateTime | null;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

// ─── Version Snapshot ──────────────────────────────────────────

export interface QuestionVersionSnapshotRecord {
  readonly id: QuestionVersionSnapshotId;
  readonly questionId: QuestionId;
  readonly version: number;
  readonly taskType: string;
  readonly prompt: JsonObject;
  readonly mediaRefs: ReadonlyArray<string>;
  readonly scoringPrinciples: ReadonlyArray<JsonObject>;
  readonly timeLimitSeconds: number | null;
  readonly preparationSeconds: number | null;
  readonly snapshot: JsonObject;
  readonly createdAt: ISO8601DateTime;
}

// ─── Playback Right Consumption ────────────────────────────────

export interface PlaybackConsumptionRecord {
  readonly id: PlaybackConsumptionId;
  readonly attemptId: QuestionAttemptId;
  readonly userId: UserId;
  readonly mediaId: string;
  readonly playCount: number;
  readonly maxPlays: number;
  readonly firstPlayedAt: ISO8601DateTime | null;
  readonly lastPlayedAt: ISO8601DateTime | null;
  readonly consumedAt: ISO8601DateTime | null;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

// ─── Response envelope ────────────────────────────────────────

export interface QuestionResponseEnvelope {
  readonly attemptId: QuestionAttemptId;
  readonly status: QuestionAttemptStatus;
  readonly response: JsonObject | null;
  readonly mode: QuestionAttemptMode;
  readonly startedAt: ISO8601DateTime;
  readonly lastAutosavedAt: ISO8601DateTime | null;
  readonly submittedAt: ISO8601DateTime | null;
  readonly timeLimitSeconds: number | null;
  readonly serverNow: ISO8601DateTime;
  readonly remainingSeconds: number | null;
  readonly playback: ReadonlyArray<PlaybackConsumptionRecord> | null;
}

// ─── Renderer contract ────────────────────────────────────────

export interface RendererContract {
  readonly taskType: string;
  readonly responseSchema: JsonObject;
  readonly emptyResponseFactory: () => JsonObject;
  readonly validateResponse: (response: JsonObject) => { valid: boolean; errors?: ReadonlyArray<string> };
  readonly normalizeResponse: (response: JsonObject) => JsonObject;
  readonly scoringAdapter: (response: JsonObject) => JsonObject;
  readonly timerPolicy: TimerPolicy;
  readonly playbackPolicy?: PlaybackPolicy;
  readonly reviewVisibilityPolicy: ReviewVisibilityPolicy;
  readonly accessibility: AccessibilityContract;
  readonly progressEventContract: ProgressEventContract;
}

export interface TimerPolicy {
  readonly serverAuthoritative: boolean;
  readonly enforceTimeLimit: boolean;
  readonly graceSeconds: number;
  readonly warnAtSeconds: number | null;
}

export interface PlaybackPolicy {
  readonly maxPlays: number;
  readonly consumeOnFirstPlay: boolean;
  readonly reconnectResetsConsumed: boolean;
  readonly policyId: string;
}

export interface ReviewVisibilityPolicy {
  readonly showQuestionPrompt: boolean;
  readonly showUserResponse: boolean;
  readonly showCorrectAnswer: boolean;
  readonly showScore: boolean;
  readonly showFeedback: boolean;
  readonly allowAnswerMutation: boolean;
}

export interface AccessibilityContract {
  readonly supportsScreenReader: boolean;
  readonly supportsKeyboardNavigation: boolean;
  readonly supportsFontScaling: boolean;
  readonly supportsReducedMotion: boolean;
  readonly supportsHighContrast: boolean;
}

export interface ProgressEventContract {
  readonly onStart: string;
  readonly onProgress: string;
  readonly onAutosave: string;
  readonly onSubmit: string;
  readonly onTimeout: string;
  readonly onError: string;
}

// ─── Create / Start Session request/response ───────────────────

export interface StartSessionRequest {
  readonly lessonId: LessonId;
  readonly mode: QuestionAttemptMode;
  readonly questionIds: ReadonlyArray<QuestionId>;
}

export interface StartSessionResponse {
  readonly session: QuestionSessionRecord;
  readonly attempts: ReadonlyArray<QuestionAttemptRecord>;
  readonly serverNow: ISO8601DateTime;
}

export interface AutosaveRequest {
  readonly attemptId: QuestionAttemptId;
  readonly response: JsonObject;
  readonly idempotencyKey?: IdempotencyKey;
}

export interface SubmitRequest {
  readonly attemptId: QuestionAttemptId;
  readonly response: JsonObject;
  readonly idempotencyKey: IdempotencyKey;
}

export interface SubmitResponse {
  readonly attempt: QuestionAttemptRecord;
  readonly status: QuestionAttemptStatus;
  readonly submittedAt: ISO8601DateTime;
  readonly serverNow: ISO8601DateTime;
}

// ─── State machine transition map ─────────────────────────────

export const VALID_ATTEMPT_TRANSITIONS: Record<QuestionAttemptStatus, ReadonlyArray<QuestionAttemptStatus>> = {
  created: ['in_progress', 'expired', 'interrupted'],
  in_progress: ['autosaved', 'submitted', 'interrupted', 'expired'],
  autosaved: ['in_progress', 'submitted', 'interrupted', 'expired'],
  submitted: ['reviewable'],
  reviewable: [],
  expired: [],
  interrupted: ['recovered', 'expired'],
  recovered: ['in_progress', 'autosaved', 'submitted', 'expired', 'interrupted'],
};

export function isValidTransition(from: QuestionAttemptStatus, to: QuestionAttemptStatus): boolean {
  return VALID_ATTEMPT_TRANSITIONS[from]?.includes(to) ?? false;
}
