import type { ScoreTrendId } from './identifiers.js';

export interface ScoreTrendPoint {
  timestamp: string;
  value: number;
  sourceResultId: string;
  profileId: string;
  profileVersion: number;
  partial: boolean;
  confidence?: number;
}

export interface ScoreTrendConfig {
  id: ScoreTrendId;
  version: number;
  timeGrouping: 'day' | 'week' | 'month' | 'quarter';
  aggregationMethod: 'mean' | 'median' | 'latest';
  minimumDataPoints: number;
  includePartial: boolean;
  profileChangePolicy: 'flag' | 'split' | 'exclude';
  staleDataThresholdDays: number;
}

export interface ScoreTrendSet {
  config: ScoreTrendConfig;
  dataPoints: ScoreTrendPoint[];
  profileChanges: Array<{ fromVersion: number; toVersion: number; effectiveAt: string }>;
  warnings: string[];
}
