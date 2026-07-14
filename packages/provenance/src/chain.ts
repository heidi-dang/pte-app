import type { AuditEventContract } from '@pte-app/contracts';
import type {
  QuestionId,
  CourseId,
  LessonId,
  ExamId,
  SessionId,
  AttemptId,
  ResultId,
  MediaId,
  UploadId,
  UserId,
  ConfigurationId,
  ISO8601DateTime,
} from '@pte-app/types';
import { deepFreeze } from './freeze.js';

export type ProvenanceTarget =
  | { readonly type: 'question'; readonly id: QuestionId }
  | { readonly type: 'course'; readonly id: CourseId }
  | { readonly type: 'lesson'; readonly id: LessonId }
  | { readonly type: 'exam'; readonly id: ExamId }
  | { readonly type: 'session'; readonly id: SessionId }
  | { readonly type: 'attempt'; readonly id: AttemptId }
  | { readonly type: 'result'; readonly id: ResultId }
  | { readonly type: 'media'; readonly id: MediaId }
  | { readonly type: 'upload'; readonly id: UploadId }
  | { readonly type: 'user'; readonly id: UserId }
  | { readonly type: 'configuration'; readonly id: ConfigurationId };

export interface ProvenanceEntry {
  readonly event: AuditEventContract;
  readonly chainIndex: number;
}

export interface ProvenanceChain {
  readonly target: ProvenanceTarget;
  readonly entries: ReadonlyArray<ProvenanceEntry>;
}

export function createProvenanceChain(target: ProvenanceTarget): ProvenanceChain {
  return deepFreeze({
    target,
    entries: [],
  });
}

export function appendToChain(chain: ProvenanceChain, event: AuditEventContract): ProvenanceChain {
  const entry: ProvenanceEntry = {
    event,
    chainIndex: chain.entries.length,
  };
  return deepFreeze({
    ...chain,
    entries: [...chain.entries, entry],
  });
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
  return deepFreeze(chain.entries.filter((entry) => entry.event.actorId === actorId).map((entry) => entry.event));
}

export function eventsByType(
  chain: ProvenanceChain,
  eventType: AuditEventContract['eventType'],
): ReadonlyArray<AuditEventContract> {
  return deepFreeze(chain.entries.filter((entry) => entry.event.eventType === eventType).map((entry) => entry.event));
}

export function eventsInRange(
  chain: ProvenanceChain,
  from: ISO8601DateTime,
  to: ISO8601DateTime,
): ReadonlyArray<AuditEventContract> {
  return deepFreeze(
    chain.entries
      .filter((entry) => entry.event.timestamp >= from && entry.event.timestamp <= to)
      .map((entry) => entry.event),
  );
}

export function chainHasEventType(chain: ProvenanceChain, eventType: AuditEventContract['eventType']): boolean {
  return chain.entries.some((entry) => entry.event.eventType === eventType);
}
