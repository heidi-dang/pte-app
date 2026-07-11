import type { EvaluationRequest, EvaluationResult, ProviderAdapter } from './types.js';

export class EvaluationService {
  constructor(private readonly provider: ProviderAdapter) {}

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const start = Date.now();
    const result = await this.provider.evaluate(request);
    return { ...result, latencyMs: Date.now() - start };
  }

  async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }
}
