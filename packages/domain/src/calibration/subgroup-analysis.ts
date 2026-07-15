export interface SubgroupResult {
  subgroupName: string;
  sampleSize: number;
  meanScore: number;
  effectSize: number;
}

export function analyzeSubgroup(scores: number[], baselineMean: number): SubgroupResult {
  const sampleSize = scores.length;
  const meanScore = sampleSize > 0 ? scores.reduce((a, b) => a + b, 0) / sampleSize : 0;
  return { subgroupName: '', sampleSize, meanScore, effectSize: meanScore - baselineMean };
}
