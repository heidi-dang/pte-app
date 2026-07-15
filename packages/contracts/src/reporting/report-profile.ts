import type { ReportProfileId } from './identifiers.js';
import type { MasteryProfile } from './mastery.js';
import type { ScoreTrendConfig } from './score-trend.js';

export interface ReportProfile {
  id: ReportProfileId;
  version: number;
  aggregationWindow: number;
  masteryPolicy: MasteryProfile;
  scoreTrendPolicy: ScoreTrendConfig;
  partialDataPolicy: 'include' | 'exclude' | 'flag';
  staleDataPolicy: 'flag' | 'exclude';
  traitAggregationPolicy: 'latest' | 'mean' | 'median';
  comparisonPolicy: 'compatible-only' | 'all-with-warning';
  exportPolicy: {
    allowedFormats: string[];
    maxExportRows: number;
  };
}
