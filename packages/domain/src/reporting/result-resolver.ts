export interface AttemptRef {
  resultId: string;
  questionVersionId: string;
  taskType: string;
  completedAt: string;
  estimatedTrainingScore: number;
}

export function resolveAttemptReference(result: AttemptRef): AttemptRef {
  return { ...result };
}

export function collectAttemptReferences(results: AttemptRef[]): AttemptRef[] {
  return results.map(resolveAttemptReference);
}
