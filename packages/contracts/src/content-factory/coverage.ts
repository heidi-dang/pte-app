export interface ContentFactoryCoverage {
  taskTypeCoverage: Record<string, { total: number; published: number; draft: number; retired: number }>;
  skillCoverage: Record<string, { total: number; withMedia: number; reviewed: number }>;
  gaps: Array<{ category: string; description: string }>;
  freshness: { lastUpdated: string; staleContentCount: number };
}
