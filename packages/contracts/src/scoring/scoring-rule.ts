/**
 * Scoring rule interface for the centralised engine.
 */
export interface ScoringRule {
  ruleType: string;
  description: string;
  evaluate(input: ScoringRuleInput): ScoringRuleOutput;
}

export interface ScoringRuleInput {
  selectedAnswers: unknown;
  correctAnswers: unknown;
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
