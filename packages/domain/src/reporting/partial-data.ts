import type { DataFreshnessStatus } from '@pte-app/contracts';

export function hasPartialData(levels: Array<{ status: string }>): boolean {
  return levels.some((l) => l.status === 'insufficient' || l.status === 'partial');
}

export function buildPartialDataWarning(sources: string[]): string | undefined {
  if (sources.length === 0) return undefined;
  return `Report includes partial or incomplete data from: ${sources.join(', ')}`;
}

export function labelScore(value: number, classification: string): string {
  return `Estimated training result: ${classification} (${value.toFixed(2)})`;
}
