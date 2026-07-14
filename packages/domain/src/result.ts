import type { ResultContract, SectionScore } from '@pte-app/contracts';
import type { ResultId, AttemptId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Result {
  readonly id: ResultId;
  readonly version: Version;
  readonly attemptId: AttemptId;
  readonly overallScore: number;
  readonly maxScore: number;
  readonly sectionScores: ReadonlyArray<SectionScore>;
  readonly passed: boolean;
  readonly scoredAt: ISO8601DateTime;
  readonly metadata: Record<string, unknown>;
}

export function createResult(contract: ResultContract): Result {
  return {
    id: contract.id,
    version: contract.version,
    attemptId: contract.attemptId,
    overallScore: contract.overallScore,
    maxScore: contract.maxScore,
    sectionScores: contract.sectionScores,
    passed: contract.passed,
    scoredAt: contract.scoredAt,
    metadata: contract.metadata as Record<string, unknown>,
  };
}

export function resultScorePercentage(result: Result): number {
  if (result.maxScore === 0) return 0;
  return (result.overallScore / result.maxScore) * 100;
}

export function resultSectionCount(result: Result): number {
  return result.sectionScores.length;
}
