import type { DatabaseConnection } from '../client.js';
import type {
  ProvenanceAuditEvent,
  AuditEventId,
  AuditEventType,
  UserId,
  RequestId,
  PolicyId,
  PolicyVersion,
} from '@pte-app/contracts';

export async function createContentAuditEvent(
  connection: DatabaseConnection,
  input: {
    id?: AuditEventId;
    eventType: AuditEventType;
    actor: UserId;
    requestId: RequestId | null;
    entityType: string;
    entityId: string;
    previousVersion: string | null;
    newVersion: string | null;
    reason: string | null;
    policyId: PolicyId | null;
    policyVersion: PolicyVersion | null;
    result: string | null;
  },
): Promise<ProvenanceAuditEvent> {
  const id = input.id ?? (crypto.randomUUID() as AuditEventId);
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_audit_events (id, event_type, actor_id, request_id, entity_type, entity_id,
      previous_version, new_version, reason, policy_id, policy_version, result)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id, event_type as "eventType", actor_id as "actor", request_id as "requestId",
               entity_type as "entityType", entity_id as "entityId",
               previous_version as "previousVersion", new_version as "newVersion",
               reason, policy_id as "policyId", policy_version as "policyVersion",
               result, occurred_at as "occurredAt"`,
    [
      id,
      input.eventType,
      input.actor,
      input.requestId,
      input.entityType,
      input.entityId,
      input.previousVersion,
      input.newVersion,
      input.reason,
      input.policyId,
      input.policyVersion,
      input.result,
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to create content audit event');
  return result.rows[0] as unknown as ProvenanceAuditEvent;
}

export async function listContentAuditEvents(
  connection: DatabaseConnection,
  options: {
    entityType?: string;
    entityId?: string;
    eventType?: AuditEventType;
    limit?: number;
  } = {},
): Promise<ProvenanceAuditEvent[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (options.entityType) {
    conditions.push(`entity_type = $${idx++}`);
    values.push(options.entityType);
  }
  if (options.entityId) {
    conditions.push(`entity_id = $${idx++}`);
    values.push(options.entityId);
  }
  if (options.eventType) {
    conditions.push(`event_type = $${idx}`);
    values.push(options.eventType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options.limit ?? 100;

  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, event_type as "eventType", actor_id as "actor", request_id as "requestId",
            entity_type as "entityType", entity_id as "entityId",
            previous_version as "previousVersion", new_version as "newVersion",
            reason, policy_id as "policyId", policy_version as "policyVersion",
            result, occurred_at as "occurredAt"
     FROM content_audit_events ${where}
     ORDER BY occurred_at DESC
     LIMIT ${limit}`,
    values,
  );
  return result.rows as unknown as ProvenanceAuditEvent[];
}
