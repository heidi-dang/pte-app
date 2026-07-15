export type DataFreshnessStatus = 'fresh' | 'stale' | 'unknown';

export interface DataFreshness {
  status: DataFreshnessStatus;
  lastUpdated: string;
  staleThresholdMs: number;
  sourceDescription: string;
  warning?: string;
}
