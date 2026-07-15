import type { AttemptReference, MasteryLevel } from '@pte-app/contracts';

export function resolveAttemptReference(result: {
  resultId: string;
  questionVersionId: string;
  taskType: string;
  completedAt: string;
  estimatedScore: number;
}): AttemptReference {
  return {
    resultId: result.resultId,
    questionVersionId: result.questionVersionId,
    taskType: result.taskType,
    completedAt: result.completedAt,
    estimatedScore: result.estimatedScore,
  };
}

export function collectAttemptReferences(
  results: Array<{
    resultId: string;
    questionVersionId: string;
    taskType: string;
    completedAt: string;
    estimatedScore: number;
  }>,
): AttemptReference[] {
  return results.map(resolveAttemptReference);
}
