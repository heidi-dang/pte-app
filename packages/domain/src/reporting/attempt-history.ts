import type { AttemptHistoryEntry, AttemptHistoryFilter, AttemptHistoryResult } from '@pte-app/contracts';

export function filterAttemptHistory(
  entries: AttemptHistoryEntry[],
  filter: AttemptHistoryFilter,
): AttemptHistoryResult {
  let filtered = entries;

  if (filter.taskTypes && filter.taskTypes.length > 0) {
    const taskTypes = filter.taskTypes;
    filtered = filtered.filter((e) => taskTypes.includes(e.taskType));
  }
  if (filter.skills && filter.skills.length > 0) {
    const skills = filter.skills;
    filtered = filtered.filter((e) => skills.includes(e.section));
  }
  if (filter.dateRange) {
    const { start, end } = filter.dateRange;
    filtered = filtered.filter((e) => e.submittedAt >= start && e.submittedAt <= end);
  }
  if (filter.mode) filtered = filtered.filter((e) => e.mode === filter.mode);
  if (filter.resultState && filter.resultState !== 'any')
    filtered = filtered.filter((e) => e.resultState === filter.resultState);

  const total = filtered.length;
  const paginated = filtered.slice(filter.offset, filter.offset + filter.limit);

  return { entries: paginated, total, limit: filter.limit, offset: filter.offset };
}
