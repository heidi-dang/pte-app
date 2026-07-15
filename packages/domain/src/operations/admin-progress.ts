export function isProgressStale(lastUpdated: string, staleThresholdMs: number): boolean {
  return Date.now() - new Date(lastUpdated).getTime() > staleThresholdMs;
}

export function estimateCompletion(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
