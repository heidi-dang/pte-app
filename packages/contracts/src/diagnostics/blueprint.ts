/**
 * Diagnostic blueprint — versioned configuration for diagnostic tests.
 */
export interface DiagnosticBlueprint {
  id: string;
  version: number;
  /** Skills included in the diagnostic. */
  includedSkills: SkillDefinition[];
  /** Task distribution across sections. */
  taskDistribution: TaskDistribution[];
  /** Difficulty distribution. */
  difficultyDistribution: DifficultyDistribution;
  /** Selection policy for questions. */
  selectionPolicy: DiagnosticSelectionPolicy;
  /** Minimum evidence required per skill. */
  minimumEvidence: number;
  /** Partial-result policy. */
  partialResultPolicy: PartialResultPolicy;
  /** Scoring profile references. */
  scoringProfileReferences: string[];
  /** Estimated result mapping. */
  estimatedResultMapping: EstimatedResultMapping[];
}

export interface SkillDefinition {
  skillId: string;
  name: string;
  description: string;
  weight: number;
}

export interface TaskDistribution {
  taskType: string;
  section: string;
  count: number;
  difficultyRange: [number, number];
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface DiagnosticSelectionPolicy {
  method: 'random' | 'stratified' | 'adaptive';
  seed?: number;
}

export interface PartialResultPolicy {
  allowPartialResults: boolean;
  minimumCompletedTasks: number;
  confidenceThreshold: number;
}

export interface EstimatedResultMapping {
  scoreRange: [number, number];
  estimatedLevel: string;
}
