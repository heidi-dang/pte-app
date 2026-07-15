export interface ReportFilter {
  dateRange?: { start: string; end: string };
  taskTypes?: string[];
  skills?: string[];
  modes?: string[];
  profileVersions?: number[];
  includePartial: boolean;
  includeFailed: boolean;
  aggregation?: string;
}
