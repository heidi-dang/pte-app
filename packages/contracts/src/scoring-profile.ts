/**
 * Scoring-profile interface.
 *
 * A versioned scoring profile defines how a task type is scored.
 */

export interface ScoringProfile {
  readonly id: string;
  readonly version: string;
  readonly taskType: string;
  readonly rules: ScoringRule[];
  readonly noResponseRule: NoResponseRule;
  readonly negativeMarking: boolean;
  readonly itemMinScore: number;
}

export interface ScoringRule {
  readonly trait: string;
  readonly weight: number;
  readonly description: string;
}

export interface NoResponseRule {
  readonly score: number;
  readonly reason: string;
}
