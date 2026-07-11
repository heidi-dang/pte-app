import type { AttemptId, ContentId, UserId, IsoTimestamp } from '@pte-app/contracts';

export type AttemptStatus = 'in_progress' | 'completed' | 'timed_out' | 'submitted' | 'scored';

export type AttemptMode = 'learning' | 'timed_practice' | 'section_test' | 'full_mock';

export interface Attempt {
  readonly id: AttemptId;
  readonly userId: UserId;
  readonly contentId: ContentId;
  readonly mode: AttemptMode;
  readonly status: AttemptStatus;
  readonly startedAt: IsoTimestamp;
  readonly submittedAt?: IsoTimestamp;
  readonly deadline?: IsoTimestamp;
  readonly response: Record<string, unknown>;
  readonly score?: AttemptScore;
  readonly scoringProfileVersion?: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface AttemptScore {
  readonly overall: number;
  readonly traits: Record<string, number>;
  readonly evidence: Record<string, unknown>;
  readonly confidence?: number;
  readonly profileVersion: string;
}

export interface Session {
  readonly id: string;
  readonly userId: UserId;
  readonly type: 'practice' | 'section_test' | 'full_mock';
  readonly attempts: AttemptId[];
  readonly status: 'in_progress' | 'completed' | 'timed_out';
  readonly deadline?: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
}
