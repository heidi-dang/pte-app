import type { EvaluationProvider } from '@pte-app/contracts';

/**
 * Fallback strategy — profile-driven provider switching.
 */
export interface FallbackPolicy {
  enabled: boolean;
  fallbackProviders: string[];
  triggerOn: 'timeout' | 'error' | 'low-confidence';
  confidenceThreshold?: number;
}

export function selectFallbackProvider(
  policy: FallbackPolicy,
  failedProviderId: string,
  availableProviders: EvaluationProvider[],
): EvaluationProvider | undefined {
  if (!policy.enabled) return undefined;
  return availableProviders.find(
    (p) => p.providerId !== failedProviderId && policy.fallbackProviders.includes(p.providerId),
  );
}
