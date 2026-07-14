import type { SessionId, ExamId, UserId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface SessionContract {
  readonly id: SessionId;
  readonly version: Version;
  readonly examId: ExamId;
  readonly userId: UserId;
  readonly status: SessionStatus;
  readonly startedAt: ISO8601DateTime;
  readonly expiresAt: ISO8601DateTime;
  readonly completedAt: ISO8601DateTime | null;
  readonly currentTaskIndex: number;
  readonly answers: ReadonlyArray<string>;
  readonly metadata: JsonObject;
}

export type SessionStatus = 'pending' | 'active' | 'paused' | 'completed' | 'expired' | 'abandoned';
