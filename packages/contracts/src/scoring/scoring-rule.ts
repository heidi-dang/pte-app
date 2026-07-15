import type { ScoringRuleDefinition } from './scoring-profile.js';

/**
 * Internal scoring rule interface used by the engine.
 */
export interface ScoringRule {
  ruleType: string;
  evaluate(input: ScoringRuleInput): ScoringRuleOutput;
}

export interface ScoringRuleInput {
  selectedAnswers: unknown;
  correctAnswers: unknown;
  params: ScoringRuleDefinition;
  context?: Record<string, unknown>;
}

export interface ScoringRuleOutput {
  score: number;
  evidence: {
    ruleType: string;
    description: string;
    contribution: number;
    metadata?: Record<string, unknown>;
  };
}
