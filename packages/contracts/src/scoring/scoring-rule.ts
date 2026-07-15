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
  params: Record<string, unknown>;
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
