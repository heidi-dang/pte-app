import type { AuditEventContract } from '@pte-app/contracts';
import type { UserId, ISO8601DateTime } from '@pte-app/types';

export interface ProvenanceEntry {
  readonly event: AuditEventContract;
  readonly chainIndex: number;
}

export interface ProvenanceChain {
  readonly targetId: string;
  readonly targetType: string;
  readonly entries: ReadonlyArray<ProvenanceEntry>;
}

export function createProvenanceChain(targetId: string, targetType: string): ProvenanceChain {
  return {
    targetId,
    targetType,
    entries: [],
  };
}

export function appendToChain(chain: ProvenanceChain, event: AuditEventContract): ProvenanceChain {
  const entry: ProvenanceEntry = {
    event,
    chainIndex: chain.entries.length,
  };
  return {
    ...chain,
    entries: [...chain.entries, entry],
  };
}

export function chainLength(chain: ProvenanceChain): number {
  return chain.entries.length;
}

export function lastEventInChain(chain: ProvenanceChain): AuditEventContract | null {
  if (chain.entries.length === 0) return null;
  const last = chain.entries[chain.entries.length - 1];
  return last !== undefined ? last.event : null;
}

export function eventsByActor(chain: ProvenanceChain, actorId: UserId): ReadonlyArray<AuditEventContract> {
  return chain.entries.filter((entry) => entry.event.actorId === actorId).map((entry) => entry.event);
}

export function eventsByType(
  chain: ProvenanceChain,
  eventType: AuditEventContract['eventType'],
): ReadonlyArray<AuditEventContract> {
  return chain.entries.filter((entry) => entry.event.eventType === eventType).map((entry) => entry.event);
}

export function eventsInRange(
  chain: ProvenanceChain,
  from: ISO8601DateTime,
  to: ISO8601DateTime,
): ReadonlyArray<AuditEventContract> {
  return chain.entries
    .filter((entry) => entry.event.timestamp >= from && entry.event.timestamp <= to)
    .map((entry) => entry.event);
}

export function chainHasEventType(chain: ProvenanceChain, eventType: AuditEventContract['eventType']): boolean {
  return chain.entries.some((entry) => entry.event.eventType === eventType);
}
