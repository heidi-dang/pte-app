import type { DatabaseConnection } from '@pte-app/database';

export interface EntitlementRecord {
  id: string;
  userId: string;
  scopeType: string;
  scopeValue: string;
  status: 'active' | 'expired' | 'cancelled';
  startsAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
}

export interface EntitlementDecision {
  allowed: boolean;
  reason: string;
  entitlementId: string | null;
  status: string | null;
  scope: string | null;
  expiry: string | null;
  historicalReadAllowed: boolean;
  newActivityAllowed: boolean;
}

export async function hasActiveEntitlement(
  connection: DatabaseConnection,
  userId: string,
  scopeType: string,
  scopeValue: string,
): Promise<EntitlementRecord | null> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id, scope_type, scope_value, status, starts_at, expires_at, cancelled_at
     FROM user_entitlements
     WHERE user_id = $1 AND scope_type = $2 AND scope_value = $3
       AND status = 'active'
       AND starts_at <= CURRENT_TIMESTAMP
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       AND cancelled_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId, scopeType, scopeValue],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    id: r.id as string,
    userId: r.user_id as string,
    scopeType: r.scope_type as string,
    scopeValue: r.scope_value as string,
    status: r.status as 'active',
    startsAt: r.starts_at as string,
    expiresAt: r.expires_at as string | null,
    cancelledAt: r.cancelled_at as string | null,
  };
}

export async function getEntitlementDecision(
  connection: DatabaseConnection,
  userId: string,
  courseAccessLevel: string,
  courseId: string,
): Promise<EntitlementDecision> {
  if (courseAccessLevel === 'free') {
    return {
      allowed: true,
      reason: 'FREE_ACCESS',
      entitlementId: null,
      status: null,
      scope: null,
      expiry: null,
      historicalReadAllowed: true,
      newActivityAllowed: true,
    };
  }

  const active = await hasActiveEntitlement(connection, userId, 'course', courseId);
  if (active) {
    return {
      allowed: true,
      reason: 'ACTIVE_ENTITLEMENT',
      entitlementId: active.id,
      status: 'active',
      scope: `course:${courseId}`,
      expiry: active.expiresAt,
      historicalReadAllowed: true,
      newActivityAllowed: true,
    };
  }

  const anyEntitlement = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, status, expires_at, cancelled_at FROM user_entitlements
     WHERE user_id = $1 AND scope_type = 'course' AND scope_value = $2
     ORDER BY created_at DESC LIMIT 1`,
    [userId, courseId],
  );

  if (anyEntitlement.rows[0]) {
    const r = anyEntitlement.rows[0];
    const st = r.status as string;
    if (st === 'expired' || (r.expires_at && r.expires_at <= new Date().toISOString())) {
      return {
        allowed: false,
        reason: 'ENTITLEMENT_EXPIRED',
        entitlementId: r.id as string,
        status: 'expired',
        scope: `course:${courseId}`,
        expiry: r.expires_at as string | null,
        historicalReadAllowed: true,
        newActivityAllowed: false,
      };
    }
    if (st === 'cancelled' || r.cancelled_at) {
      return {
        allowed: false,
        reason: 'ENTITLEMENT_CANCELLED',
        entitlementId: r.id as string,
        status: 'cancelled',
        scope: `course:${courseId}`,
        expiry: null,
        historicalReadAllowed: true,
        newActivityAllowed: false,
      };
    }
  }

  const anyActive = await connection.pool.query<Record<string, unknown>>(
    `SELECT id FROM user_entitlements WHERE user_id = $1 AND status = 'active'
       AND starts_at <= CURRENT_TIMESTAMP AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) LIMIT 1`,
    [userId],
  );
  if (anyActive.rows[0]) {
    return {
      allowed: false,
      reason: 'ENTITLEMENT_SCOPE_MISMATCH',
      entitlementId: null,
      status: null,
      scope: null,
      expiry: null,
      historicalReadAllowed: false,
      newActivityAllowed: false,
    };
  }

  return {
    allowed: false,
    reason: 'ENTITLEMENT_REQUIRED',
    entitlementId: null,
    status: null,
    scope: null,
    expiry: null,
    historicalReadAllowed: false,
    newActivityAllowed: false,
  };
}

export async function createEntitlement(
  connection: DatabaseConnection,
  input: { userId: string; scopeType: string; scopeValue: string; expiresAt?: string | null; requestId?: string },
): Promise<EntitlementRecord> {
  if (input.scopeType !== 'course') throw new Error('Invalid scope type');
  if (input.expiresAt && input.expiresAt <= new Date().toISOString()) throw new Error('Entitlement already expired');

  const existing = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id, scope_type, scope_value, status, starts_at, expires_at, cancelled_at
     FROM user_entitlements WHERE user_id = $1 AND scope_type = $2 AND scope_value = $3
     ORDER BY created_at DESC LIMIT 1`,
    [input.userId, input.scopeType, input.scopeValue],
  );
  if (existing.rows[0]) {
    const r = existing.rows[0];
    if (r.status === 'active' && (!r.expires_at || r.expires_at > new Date().toISOString())) {
      return {
        id: r.id as string,
        userId: r.user_id as string,
        scopeType: r.scope_type as string,
        scopeValue: r.scope_value as string,
        status: 'active',
        startsAt: r.starts_at as string,
        expiresAt: r.expires_at as string | null,
        cancelledAt: r.cancelled_at as string | null,
      };
    }
  }

  const r = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO user_entitlements (user_id, scope_type, scope_value, expires_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, scope_type, scope_value, status) DO NOTHING
     RETURNING id, user_id, scope_type, scope_value, status, starts_at, expires_at, cancelled_at`,
    [input.userId, input.scopeType, input.scopeValue, input.expiresAt ?? null],
  );
  if (r.rows[0]) {
    const row = r.rows[0];
    return {
      id: row.id as string,
      userId: row.user_id as string,
      scopeType: row.scope_type as string,
      scopeValue: row.scope_value as string,
      status: row.status as 'active',
      startsAt: row.starts_at as string,
      expiresAt: row.expires_at as string | null,
      cancelledAt: row.cancelled_at as string | null,
    };
  }

  const dup = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id, scope_type, scope_value, status, starts_at, expires_at, cancelled_at
     FROM user_entitlements WHERE user_id = $1 AND scope_type = $2 AND scope_value = $3 AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [input.userId, input.scopeType, input.scopeValue],
  );
  if (dup.rows[0]) {
    const row = dup.rows[0];
    return {
      id: row.id as string,
      userId: row.user_id as string,
      scopeType: row.scope_type as string,
      scopeValue: row.scope_value as string,
      status: 'active',
      startsAt: row.starts_at as string,
      expiresAt: row.expires_at as string | null,
      cancelledAt: row.cancelled_at as string | null,
    };
  }
  throw new Error('Failed to create entitlement');
}

export async function cancelEntitlement(
  connection: DatabaseConnection,
  userId: string,
  scopeType: string,
  scopeValue: string,
): Promise<EntitlementRecord | null> {
  const r = await connection.pool.query<Record<string, unknown>>(
    `UPDATE user_entitlements SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND scope_type = $2 AND scope_value = $3 AND status = 'active'
     RETURNING id, user_id, scope_type, scope_value, status, starts_at, expires_at, cancelled_at`,
    [userId, scopeType, scopeValue],
  );
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    scopeType: row.scope_type as string,
    scopeValue: row.scope_value as string,
    status: row.status as string as 'cancelled',
    startsAt: row.starts_at as string,
    expiresAt: row.expires_at as string | null,
    cancelledAt: row.cancelled_at as string | null,
  };
}

export async function expireEntitlements(connection: DatabaseConnection): Promise<number> {
  const r = await connection.pool.query(
    `UPDATE user_entitlements SET status = 'expired'
     WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`,
  );
  return r.rowCount ?? 0;
}
