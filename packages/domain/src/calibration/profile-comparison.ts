export interface ProfileComparisonResult {
  overallDelta: number;
  regressions: string[];
  improvements: string[];
  inconclusive: boolean;
}

export function compareProfiles(
  baseline: Record<string, number>,
  candidate: Record<string, number>,
): ProfileComparisonResult {
  const regressions: string[] = [];
  const improvements: string[] = [];
  let overallDelta = 0;
  let count = 0;

  for (const [key, baseVal] of Object.entries(baseline)) {
    const candVal = candidate[key];
    if (candVal !== undefined) {
      const delta = candVal - baseVal;
      overallDelta += delta;
      count++;
      if (delta < -0.01) regressions.push(key);
      if (delta > 0.01) improvements.push(key);
    }
  }

  return {
    overallDelta: count > 0 ? overallDelta / count : 0,
    regressions,
    improvements,
    inconclusive: count === 0,
  };
}
