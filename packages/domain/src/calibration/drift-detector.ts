export interface DriftResult {
  drifted: boolean;
  magnitude: number;
  threshold: number;
}

export function detectDrift(baselineMetric: number, candidateMetric: number, threshold: number): DriftResult {
  const magnitude = Math.abs(candidateMetric - baselineMetric);
  return { drifted: magnitude > threshold, magnitude, threshold };
}
