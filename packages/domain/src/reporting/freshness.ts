import type { DataFreshness, DataFreshnessStatus } from '@pte-app/contracts';

export function evaluateFreshness(
  lastUpdated: string,
  staleThresholdMs: number,
  sourceDescription: string,
): DataFreshness {
  const elapsed = Date.now() - new Date(lastUpdated).getTime();
  const status: DataFreshnessStatus = elapsed > staleThresholdMs ? 'stale' : 'fresh';
  const warning = status === 'stale' ? `Data is stale (${Math.round(elapsed / 3600000)}h old)` : undefined;

  return { status, lastUpdated, staleThresholdMs, sourceDescription, warning };
}
