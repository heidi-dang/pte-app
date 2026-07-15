/**
 * Evaluation result — always labelled as estimated training result.
 */
export interface EvaluationResult {
  resultId: string;
  requestCorrelationId: string;
  providerId: string;
  providerVersion: string;
  evaluationProfileVersion: number;
  scoringProfileVersion: number;
  /** Must be 'estimated-training-result' — never claimed as official. */
  resultClassification: 'estimated-training-result';
  estimatedScore: number;
  componentEvidence: EvaluationEvidence[];
  confidence: ConfidenceInfo;
  warnings: string[];
  limitations: string[];
  createdAt: string;
}

export interface EvaluationEvidence {
  traitType: string;
  description: string;
  score: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface ConfidenceInfo {
  overallConfidence: number;
  transcriptionConfidence?: number;
  evidenceConfidence?: number;
}
