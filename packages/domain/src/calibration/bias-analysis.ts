export interface BiasResult {
  hasBias: boolean;
  details: string[];
}

export function detectBias(subgroupMeans: number[], baselineMean: number, threshold: number): BiasResult {
  const details: string[] = [];
  for (const mean of subgroupMeans) {
    if (Math.abs(mean - baselineMean) > threshold) {
      details.push(
        `Subgroup mean ${mean.toFixed(3)} deviates from baseline ${baselineMean.toFixed(3)} by ${Math.abs(mean - baselineMean).toFixed(3)}`,
      );
    }
  }
  return { hasBias: details.length > 0, details };
}
