import type { DatabaseConnection } from '../client.js';
import type { SessionRecord } from '../config.js';

export interface CreateSessionInput {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: string;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
}

export async function createSession(connection: DatabaseConnection, input: CreateSessionInput): Promise<SessionRecord> {
  const result = await connection.pool.query<SessionRecord>(
    `INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id as "userId", token_hash as "tokenHash", expires_at as "expiresAt",
               revoked_at as "revokedAt", ip_address as "ipAddress", user_agent as "userAgent",
               created_at as "createdAt"`,
    [input.userId, input.tokenHash, input.expiresAt, input.ipAddress ?? null, input.userAgent ?? null],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create session');
  return row;
}

export async function getSessionByTokenHash(
  connection: DatabaseConnection,
  tokenHash: string,
): Promise<SessionRecord | undefined> {
  const result = await connection.pool.query<SessionRecord>(
    `SELECT id, user_id as "userId", token_hash as "tokenHash", expires_at as "expiresAt",
            revoked_at as "revokedAt", ip_address as "ipAddress", user_agent as "userAgent",
            created_at as "createdAt"
     FROM sessions
     WHERE token_hash = $1`,
    [tokenHash],
  );
  return result.rows[0];
}

export async function getSessionsByUserId(connection: DatabaseConnection, userId: string): Promise<SessionRecord[]> {
  const result = await connection.pool.query<SessionRecord>(
    `SELECT id, user_id as "userId", token_hash as "tokenHash", expires_at as "expiresAt",
            revoked_at as "revokedAt", ip_address as "ipAddress", user_agent as "userAgent",
            created_at as "createdAt"
     FROM sessions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function revokeSession(connection: DatabaseConnection, sessionId: string): Promise<boolean> {
  const result = await connection.pool.query(
    'UPDATE sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL',
    [sessionId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function revokeAllUserSessions(
  connection: DatabaseConnection,
  userId: string,
  exceptSessionId?: string,
): Promise<void> {
  if (exceptSessionId) {
    await connection.pool.query(
      'UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL AND id <> $2',
      [userId, exceptSessionId],
    );
  } else {
    await connection.pool.query('UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [
      userId,
    ]);
  }
}
