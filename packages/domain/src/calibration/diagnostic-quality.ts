export interface DiagnosticQualityMetrics {
  falsePositives: number;
  falseNegatives: number;
  coverage: number;
}

export function evaluateDiagnosticQuality(
  predictedWeaknesses: string[],
  observedWeaknesses: string[],
  totalSkills: number,
): DiagnosticQualityMetrics {
  const falsePositives = predictedWeaknesses.filter((p) => !observedWeaknesses.includes(p)).length;
  const falseNegatives = observedWeaknesses.filter((o) => !predictedWeaknesses.includes(o)).length;
  return {
    falsePositives,
    falseNegatives,
    coverage: totalSkills > 0 ? (totalSkills - falseNegatives) / totalSkills : 0,
  };
}
