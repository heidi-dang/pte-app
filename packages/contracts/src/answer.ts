import type { AttemptId, JsonObject, Version, ISO8601DateTime } from '@pte-app/types';

export interface AnswerContract {
  readonly attemptId: AttemptId;
  readonly version: Version;
  readonly questionId: string;
  readonly response: AnswerResponse;
  readonly submittedAt: ISO8601DateTime;
  readonly durationMs: number;
  readonly metadata: JsonObject;
}

export interface AnswerResponse {
  readonly type: 'text' | 'audio' | 'file' | 'selection';
  readonly value: string | null;
  readonly filePath: string | null;
  readonly selectionIndices: ReadonlyArray<number> | null;
}
