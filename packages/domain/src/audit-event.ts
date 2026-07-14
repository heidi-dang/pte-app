import type { AuditEventContract, AuditEventType } from '@pte-app/contracts';
import type { AuditEventId, UserId, Version, ISO8601DateTime } from '@pte-app/types';

export interface AuditEvent {
  readonly id: AuditEventId;
  readonly version: Version;
  readonly eventType: AuditEventType;
  readonly actorId: UserId;
  readonly targetType: string;
  readonly targetId: string;
  readonly changes: Record<string, unknown>;
  readonly timestamp: ISO8601DateTime;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadata: Record<string, unknown>;
}

export function createAuditEvent(contract: AuditEventContract): AuditEvent {
  return {
    id: contract.id,
    version: contract.version,
    eventType: contract.eventType,
    actorId: contract.actorId,
    targetType: contract.targetType,
    targetId: contract.targetId,
    changes: contract.changes as Record<string, unknown>,
    timestamp: contract.timestamp,
    ipAddress: contract.ipAddress,
    userAgent: contract.userAgent,
    metadata: contract.metadata as Record<string, unknown>,
  };
}

export function auditEventIsCreate(auditEvent: AuditEvent): boolean {
  return auditEvent.eventType === 'created';
}

export function auditEventIsDelete(auditEvent: AuditEvent): boolean {
  return auditEvent.eventType === 'deleted';
}
