import type { DatabaseConnection } from '../client.js';
import type { AuditEventRecord } from '../config.js';

export interface CreateAuditEventInput {
  readonly version: string;
  readonly eventType: string;
  readonly actorId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly changes?: Record<string, unknown>;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly metadata?: Record<string, unknown>;
}

export async function createAuditEvent(
  connection: DatabaseConnection,
  input: CreateAuditEventInput,
): Promise<AuditEventRecord> {
  const result = await connection.pool.query<AuditEventRecord>(
    `INSERT INTO audit_events (version, event_type, actor_id, target_type, target_id, changes, ip_address, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, version, event_type as "eventType", actor_id as "actorId",
               target_type as "targetType", target_id as "targetId", changes,
               timestamp, ip_address as "ipAddress", user_agent as "userAgent", metadata`,
    [
      input.version,
      input.eventType,
      input.actorId,
      input.targetType,
      input.targetId,
      JSON.stringify(input.changes ?? {}),
      input.ipAddress ?? null,
      input.userAgent ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create audit event');
  return row;
}

export async function getAuditEventsByTarget(
  connection: DatabaseConnection,
  targetType: string,
  targetId: string,
): Promise<AuditEventRecord[]> {
  const result = await connection.pool.query<AuditEventRecord>(
    `SELECT id, version, event_type as "eventType", actor_id as "actorId",
            target_type as "targetType", target_id as "targetId", changes,
            timestamp, ip_address as "ipAddress", user_agent as "userAgent", metadata
     FROM audit_events
     WHERE target_type = $1 AND target_id = $2
     ORDER BY timestamp DESC`,
    [targetType, targetId],
  );
  return result.rows;
}
