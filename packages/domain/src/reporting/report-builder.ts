import type { ReportFilter } from '@pte-app/contracts';
import type {
  ScoreTrendSet,
  MasterySnapshot,
  TraitAnalysis,
  WeaknessReport,
  AttemptHistoryResult,
  MockComparison,
} from '@pte-app/contracts';

export interface CompositeReport {
  id: string;
  userId: string;
  filter: ReportFilter;
  scoreTrend?: ScoreTrendSet;
  mastery?: MasterySnapshot;
  traitAnalysis?: TraitAnalysis;
  weaknessReport?: WeaknessReport;
  attemptHistory?: AttemptHistoryResult;
  mockComparison?: MockComparison;
  generatedAt: string;
  warnings: string[];
  partialData: boolean;
}

export function buildCompositeReport(
  userId: string,
  filter: ReportFilter,
  components: Partial<Omit<CompositeReport, 'id' | 'userId' | 'filter' | 'generatedAt' | 'warnings' | 'partialData'>>,
): CompositeReport {
  const warnings: string[] = [];
  let partialData = false;

  if (components.scoreTrend?.warnings) warnings.push(...components.scoreTrend.warnings);
  if (components.mastery?.warnings) warnings.push(...components.mastery.warnings);
  if (components.traitAnalysis?.warnings) warnings.push(...components.traitAnalysis.warnings);
  if (components.mastery?.partialData) partialData = true;

  return {
    id: crypto.randomUUID(),
    userId,
    filter,
    ...components,
    generatedAt: new Date().toISOString(),
    warnings,
    partialData,
  };
}
