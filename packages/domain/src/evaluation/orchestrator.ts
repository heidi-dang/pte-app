import type {
  EvaluationProvider,
  EvaluationProviderRegistry,
  EvaluationRequest,
  EvaluationResult,
} from '@pte-app/contracts';

/**
 * Provider-neutral evaluation orchestrator.
 * Routes evaluation requests to the appropriate provider.
 */
export class EvaluationOrchestrator {
  private readonly providers: Map<string, EvaluationProvider> = new Map();

  constructor(private readonly registry: EvaluationProviderRegistry) {}

  async evaluate(request: EvaluationRequest, providerType: string): Promise<EvaluationResult> {
    const provider = this.registry.getProvider(providerType, request.providerConfigReference);
    if (!provider) {
      throw new Error(`No provider found for type: ${providerType}, id: ${request.providerConfigReference}`);
    }
    return provider.evaluate(request);
  }
}
