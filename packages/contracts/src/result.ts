import type { ResultId, AttemptId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface ResultContract {
  readonly id: ResultId;
  readonly version: Version;
  readonly attemptId: AttemptId;
  readonly overallScore: number;
  readonly maxScore: number;
  readonly sectionScores: ReadonlyArray<SectionScore>;
  readonly passed: boolean;
  readonly scoredAt: ISO8601DateTime;
  readonly metadata: JsonObject;
}

export interface SectionScore {
  readonly sectionId: string;
  readonly sectionName: string;
  readonly score: number;
  readonly maxScore: number;
  readonly percentage: number;
}
