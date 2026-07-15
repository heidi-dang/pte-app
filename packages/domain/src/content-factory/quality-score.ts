import type { QualityProfile } from '@pte-app/contracts';

export function calculateQualityScore(
  profile: QualityProfile,
  componentResults: Record<string, number>,
): { overall: number; failedRequirements: string[] } {
  const failedRequirements: string[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [name, config] of Object.entries(profile.components)) {
    const score = componentResults[name] ?? 0;
    if (config.required && score < config.threshold) {
      failedRequirements.push(name);
    }
    weightedSum += score * config.weight;
    totalWeight += config.weight;
  }

  const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return { overall, failedRequirements };
}
