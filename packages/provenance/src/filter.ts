import type { AuditEventContract } from '@pte-app/contracts';
import type { UserId } from '@pte-app/types';
import { deepFreeze } from './freeze.js';

export interface AuditEventFilter {
  readonly eventType?: AuditEventContract['eventType'];
  readonly actorId?: UserId;
  readonly targetType?: string;
  readonly from?: string;
  readonly to?: string;
}

export function matchesFilter(event: AuditEventContract, filter: AuditEventFilter): boolean {
  if (filter.eventType && event.eventType !== filter.eventType) return false;
  if (filter.actorId && event.actorId !== filter.actorId) return false;
  if (filter.targetType && event.targetType !== filter.targetType) return false;
  if (filter.from && event.timestamp < filter.from) return false;
  if (filter.to && event.timestamp > filter.to) return false;
  return true;
}

export function filterEvents(
  events: ReadonlyArray<AuditEventContract>,
  filter: AuditEventFilter,
): ReadonlyArray<AuditEventContract> {
  return deepFreeze(events.filter((event) => matchesFilter(event, filter)));
}
