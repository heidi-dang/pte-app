import type { QuestionContract, QuestionMediaReference, ScoringPrinciple } from '@pte-app/contracts';
import type { QuestionId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Question {
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
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export function createQuestion(contract: QuestionContract): Question {
  return {
    id: contract.id,
    version: contract.version,
    taskType: contract.taskType,
    section: contract.section,
    skillAssessed: contract.skillAssessed,
    prompt: contract.prompt,
    media: contract.media,
    timeLimitSeconds: contract.timeLimitSeconds,
    preparationSeconds: contract.preparationSeconds,
    maximumAttempts: contract.maximumAttempts,
    scoringPrinciples: contract.scoringPrinciples,
    metadata: contract.metadata as Record<string, unknown>,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export function questionTaskType(q: Question): string {
  return q.taskType;
}

export function questionSection(q: Question): string {
  return q.section;
}

export function questionHasTimeLimit(q: Question): boolean {
  return q.timeLimitSeconds !== null;
}

export function questionHasPreparation(q: Question): boolean {
  return q.preparationSeconds !== null;
}
