export interface ScoringProfile {
  readonly id: string;
  readonly version: string;
  readonly taskType: string;
  readonly partialCredit: boolean;
  readonly negativeMarking: boolean;
  readonly itemMinScore: number;
  readonly itemMaxScore: number;
  readonly noResponseScore: number;
  readonly rules: ScoringRule[];
}

export interface ScoringRule {
  readonly trait: string;
  readonly weight: number;
  readonly description: string;
}

export interface ScoringInput {
  readonly profile: ScoringProfile;
  readonly correctAnswer: Record<string, unknown>;
  readonly studentResponse: Record<string, unknown>;
}

export interface ScoringResult {
  readonly score: number;
  readonly maxScore: number;
  readonly percentage: number;
  readonly traits: Record<string, TraitResult>;
  readonly evidence: Record<string, unknown>;
  readonly profileVersion: string;
}

export interface TraitResult {
  readonly score: number;
  readonly maxScore: number;
  readonly details?: string;
}
