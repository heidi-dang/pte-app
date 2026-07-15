import type { EvaluationProvider, EvaluationProviderRegistry } from '@pte-app/contracts';

/**
 * In-memory provider registry implementation.
 */
export class InMemoryProviderRegistry implements EvaluationProviderRegistry {
  private readonly providers = new Map<string, EvaluationProvider>();

  register(provider: EvaluationProvider): void {
    const key = `${provider.providerType}:${provider.providerId}`;
    if (this.providers.has(key)) {
      throw new Error(`Provider already registered: ${key}`);
    }
    this.providers.set(key, provider);
  }

  getProvider(providerType: string, providerId: string): EvaluationProvider | undefined {
    return this.providers.get(`${providerType}:${providerId}`);
  }

  listProviders(providerType: string): EvaluationProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.providerType === providerType);
  }
}
