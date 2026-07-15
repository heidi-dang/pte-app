export function calculateCoverage(
  total: number,
  covered: number,
): { percentage: number; gap: number; sufficient: boolean } {
  const percentage = total > 0 ? (covered / total) * 100 : 0;
  const gap = total - covered;
  return { percentage, gap, sufficient: percentage >= 80 };
}
