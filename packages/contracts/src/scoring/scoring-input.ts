import type { QuestionVersionId } from '../question-engine/identifiers.js';

/**
 * Input for the scoring engine.
 */
export interface ScoringInput {
  questionVersionId: QuestionVersionId;
  taskType: string;
  selectedAnswers: unknown;
  correctAnswers: unknown;
  /** Additional context (e.g., reorder positions, blank positions). */
  context?: Record<string, unknown>;
}
