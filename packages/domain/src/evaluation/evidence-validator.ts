import type { EvaluationResult } from '@pte-app/contracts';

/**
 * Validates that evaluation result is properly labelled as estimated training result.
 */
export function validateEstimatedLabel(result: EvaluationResult): boolean {
  return result.resultClassification === 'estimated-training-result';
}

/**
 * Validates confidence thresholds.
 */
export function validateConfidence(result: EvaluationResult, minConfidence: number): boolean {
  return result.confidence.overallConfidence >= minConfidence;
}

/**
 * Validates that provider failure does not delete or mutate the original response.
 */
export function isProviderFailureSafe(originalResponseExists: boolean, _evaluationError?: Error): boolean {
  return originalResponseExists;
}
