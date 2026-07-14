import type { FeedbackId, AttemptId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface FeedbackContract {
  readonly id: FeedbackId;
  readonly version: Version;
  readonly attemptId: AttemptId;
  readonly type: FeedbackType;
  readonly content: string;
  readonly criterion: string | null;
  readonly score: number | null;
  readonly generatedBy: string;
  readonly createdAt: ISO8601DateTime;
  readonly metadata: JsonObject;
}

export type FeedbackType = 'scoring' | 'coaching' | 'diagnostic' | 'system';
