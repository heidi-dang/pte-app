import type { AttemptId, UserId, ExamId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface AttemptContract {
  readonly id: AttemptId;
  readonly version: Version;
  readonly userId: UserId;
  readonly examId: ExamId;
  readonly sessionId: string;
  readonly status: AttemptStatus;
  readonly questionResponses: ReadonlyArray<QuestionResponse>;
  readonly startedAt: ISO8601DateTime;
  readonly completedAt: ISO8601DateTime | null;
  readonly totalScore: number | null;
  readonly metadata: JsonObject;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'scored' | 'reviewed' | 'voided';

export interface QuestionResponse {
  readonly questionId: string;
  readonly answer: string | null;
  readonly score: number | null;
  readonly durationMs: number;
}
