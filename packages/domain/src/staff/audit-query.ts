import type { AuditQuery, AuditViewEntry } from '@pte-app/contracts';

export function filterAuditEntries(entries: AuditViewEntry[], query: AuditQuery): AuditViewEntry[] {
  let filtered = entries;
  if (query.filters.actorIds?.length) filtered = filtered.filter((e) => query.filters.actorIds!.includes(e.actorId));
  if (query.filters.actionTypes?.length)
    filtered = filtered.filter((e) => query.filters.actionTypes!.includes(e.actionType));
  if (query.filters.dateRange) {
    filtered = filtered.filter(
      (e) => e.timestamp >= query.filters.dateRange!.start && e.timestamp <= query.filters.dateRange!.end,
    );
  }
  if (query.filters.resourceTypes?.length)
    filtered = filtered.filter((e) => query.filters.resourceTypes!.includes(e.resourceType));
  const total = filtered.length;
  return filtered.slice(query.offset, query.offset + query.limit);
}
