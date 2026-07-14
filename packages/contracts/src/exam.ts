import type {
  ExamId,
  QuestionId,
  SectionId,
  Version,
  ISO8601DateTime,
  NonEmptyString,
  JsonObject,
} from '@pte-app/types';

export interface ExamContract {
  readonly id: ExamId;
  readonly version: Version;
  readonly title: NonEmptyString;
  readonly description: string;
  readonly taskIds: ReadonlyArray<QuestionId>;
  readonly timeLimitMinutes: number;
  readonly sections: ReadonlyArray<ExamSection>;
  readonly scoringProfile: string;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export interface ExamSection {
  readonly id: SectionId;
  readonly name: string;
  readonly taskIds: ReadonlyArray<QuestionId>;
  readonly timeLimitMinutes: number;
}
