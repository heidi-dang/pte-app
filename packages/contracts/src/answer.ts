import type { AttemptId, QuestionId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface AnswerContract {
  readonly attemptId: AttemptId;
  readonly version: Version;
  readonly questionId: QuestionId;
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
