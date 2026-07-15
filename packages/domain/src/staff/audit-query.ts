import type { AuditQuery, AuditViewEntry } from '@pte-app/contracts';

export function filterAuditEntries(entries: AuditViewEntry[], query: AuditQuery): AuditViewEntry[] {
  let filtered = entries;
  if (query.filters.actorIds?.length) {
    const ids = query.filters.actorIds;
    filtered = filtered.filter((e) => ids.includes(e.actorId));
  }
  if (query.filters.actionTypes?.length) {
    const types = query.filters.actionTypes;
    filtered = filtered.filter((e) => types.includes(e.actionType));
  }
  if (query.filters.dateRange) {
    const { start, end } = query.filters.dateRange;
    filtered = filtered.filter((e) => e.timestamp >= start && e.timestamp <= end);
  }
  if (query.filters.resourceTypes?.length) {
    const resources = query.filters.resourceTypes;
    filtered = filtered.filter((e) => resources.includes(e.resourceType));
  }
  return filtered.slice(query.offset, query.offset + query.limit);
}
