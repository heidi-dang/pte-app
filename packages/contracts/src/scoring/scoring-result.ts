import type { ScoringProfileId } from '../question-engine/identifiers.js';

/**
 * Result from the scoring engine.
 */
export interface ScoringResult {
  resultId: string;
  attemptId: string;
  questionVersionId: string;
  scoringProfileId: ScoringProfileId;
  scoringProfileVersion: number;
  engineVersion: string;
  rawResult: number;
  boundedResult: number;
  componentEvidence: ScoringEvidence[];
  noResponse: boolean;
  createdAt: string;
  supersedesResultId?: string;
  resultType: 'original' | 'rescore';
}

export interface ScoringEvidence {
  ruleType: string;
  description: string;
  contribution: number;
  metadata?: Record<string, unknown>;
}
