export type EvaluationProvider = 'mock_openai' | 'mock_gemini' | 'custom';

export interface EvaluationRequest {
  readonly attemptId: string;
  readonly taskType: string;
  readonly prompt: Record<string, unknown>;
  readonly studentResponse: Record<string, unknown>;
  readonly profileVersion: string;
}

export interface EvaluationResult {
  readonly score?: number;
  readonly traits: Record<string, number>;
  readonly evidence: Record<string, unknown>;
  readonly confidence: number;
  readonly provider: string;
  readonly providerVersion: string;
  readonly latencyMs: number;
}

export interface ProviderAdapter {
  readonly name: string;
  evaluate: (req: EvaluationRequest) => Promise<EvaluationResult>;
  healthCheck: () => Promise<boolean>;
}
