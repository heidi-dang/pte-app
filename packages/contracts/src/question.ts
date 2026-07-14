import type { QuestionId, JsonObject, Version, ISO8601DateTime } from '@pte-app/types';

export interface QuestionContract {
  readonly id: QuestionId;
  readonly version: Version;
  readonly taskType: string;
  readonly section: string;
  readonly skillAssessed: string;
  readonly prompt: string;
  readonly media: ReadonlyArray<QuestionMediaReference>;
  readonly timeLimitSeconds: number | null;
  readonly preparationSeconds: number | null;
  readonly maximumAttempts: number;
  readonly scoringPrinciples: ReadonlyArray<ScoringPrinciple>;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export interface QuestionMediaReference {
  readonly mediaId: string;
  readonly type: string;
  readonly required: boolean;
}

export interface ScoringPrinciple {
  readonly criterion: string;
  readonly weight: number;
  readonly description: string;
}
