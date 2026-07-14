import type { AuditEventId, UserId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface AuditEventContract {
  readonly id: AuditEventId;
  readonly version: Version;
  readonly eventType: AuditEventType;
  readonly actorId: UserId;
  readonly targetType: string;
  readonly targetId: string;
  readonly changes: JsonObject;
  readonly timestamp: ISO8601DateTime;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadata: JsonObject;
}

export type AuditEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'published'
  | 'retired'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'accessed'
  | 'exported';
