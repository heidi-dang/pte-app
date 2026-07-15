/**
 * Mock exam result — estimated training result.
 */
export interface MockResult {
  id: string;
  sessionId: string;
  blueprintId: string;
  blueprintVersion: number;
  /** Must be 'estimated-training-result'. */
  resultClassification: 'estimated-training-result';
  /** Per-section scores. */
  sectionScores: MockSectionScore[];
  /** Overall estimated score. */
  overallScore: number;
  /** Total scoring/evaluation profile versions. */
  scoringProfileVersions: Record<string, number>;
  evaluationProfileVersions: Record<string, number>;
  /** Whether all components completed. */
  isComplete: boolean;
  /** Missing/failed components. */
  missingComponents: string[];
  /** Confidence information. */
  confidence: number;
  /** Component evidence. */
  componentEvidence: MockComponentEvidence[];
  createdAt: string;
}

export interface MockSectionScore {
  section: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  taskTypeScores: Record<string, number>;
}

export interface MockComponentEvidence {
  section: string;
  taskType: string;
  questionVersionId: string;
  score: number;
  evidence: string;
}
