import type { AttemptHistoryEntry, AttemptHistoryFilter, AttemptHistoryResult } from '@pte-app/contracts';

export function filterAttemptHistory(
  entries: AttemptHistoryEntry[],
  filter: AttemptHistoryFilter,
): AttemptHistoryResult {
  let filtered = entries;

  if (filter.taskTypes?.length) filtered = filtered.filter((e) => filter.taskTypes.includes(e.taskType));
  if (filter.skills?.length) filtered = filtered.filter((e) => filter.skills.includes(e.section));
  if (filter.dateRange)
    filtered = filtered.filter((e) => e.submittedAt >= filter.dateRange.start && e.submittedAt <= filter.dateRange.end);
  if (filter.mode) filtered = filtered.filter((e) => e.mode === filter.mode);
  if (filter.resultState && filter.resultState !== 'any')
    filtered = filtered.filter((e) => e.resultState === filter.resultState);

  const total = filtered.length;
  const paginated = filtered.slice(filter.offset, filter.offset + filter.limit);

  return { entries: paginated, total, limit: filter.limit, offset: filter.offset };
}
