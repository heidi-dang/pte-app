import type { ExamId, Version, ISO8601DateTime, NonEmptyString, JsonObject } from '@pte-app/types';

export interface ExamContract {
  readonly id: ExamId;
  readonly version: Version;
  readonly title: NonEmptyString;
  readonly description: string;
  readonly taskIds: ReadonlyArray<string>;
  readonly timeLimitMinutes: number;
  readonly sections: ReadonlyArray<ExamSection>;
  readonly scoringProfile: string;
  readonly passingScore: number;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export interface ExamSection {
  readonly id: string;
  readonly name: string;
  readonly taskIds: ReadonlyArray<string>;
  readonly timeLimitMinutes: number;
}
