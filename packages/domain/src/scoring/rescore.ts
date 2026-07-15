import type { ScoringResult } from '@pte-app/contracts';

/**
 * Rescore — creates a new result without mutating the original.
 */
export function rescore(
  originalResult: ScoringResult,
  newBoundedResult: number,
  newEvidence: ScoringResult['componentEvidence'],
  reason: string,
): ScoringResult {
  return {
    resultId: `rescore_${Date.now()}`,
    attemptId: originalResult.attemptId,
    questionVersionId: originalResult.questionVersionId,
    scoringProfileId: originalResult.scoringProfileId,
    scoringProfileVersion: originalResult.scoringProfileVersion,
    engineVersion: originalResult.engineVersion,
    rawResult: newBoundedResult,
    boundedResult: newBoundedResult,
    componentEvidence: [
      ...newEvidence,
      {
        ruleType: 'rescore',
        description: reason,
        contribution: 0,
      },
    ],
    noResponse: false,
    createdAt: new Date().toISOString(),
    supersedesResultId: originalResult.resultId,
    resultType: 'rescore',
  };
}
