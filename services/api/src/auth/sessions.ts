import type { DatabaseConnection } from '@pte-app/database';
import { sessions as sessionsRepo } from '@pte-app/database';
import { hashToken, generateSessionToken } from './crypto.js';
import type { AuthConfig } from './config.js';

export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: string;
  readonly revokedAt: string | null;
  readonly createdAt: string;
}

export async function createSession(
  db: DatabaseConnection,
  config: AuthConfig,
  userId: string,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<{ token: string; session: Session }> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.sessionDurationMinutes * 60 * 1000).toISOString();

  const record = await sessionsRepo.createSession(db, {
    userId,
    tokenHash,
    expiresAt,
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
  });

  return {
    token,
    session: {
      id: record.id,
      userId: record.userId,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      createdAt: record.createdAt,
    },
  };
}

export async function validateSession(
  db: DatabaseConnection,
  token: string,
): Promise<{ userId: string; sessionId: string } | null> {
  const tokenHash = hashToken(token);
  const record = await sessionsRepo.getSessionByTokenHash(db, tokenHash);
  if (!record) return null;
  if (record.revokedAt) return null;
  if (new Date(record.expiresAt) <= new Date()) return null;
  return { userId: record.userId, sessionId: record.id };
}

export async function revokeSession(db: DatabaseConnection, sessionId: string): Promise<boolean> {
  return sessionsRepo.revokeSession(db, sessionId);
}

export async function revokeOtherSessions(
  db: DatabaseConnection,
  userId: string,
  currentSessionId: string,
): Promise<void> {
  return sessionsRepo.revokeAllUserSessions(db, userId, currentSessionId);
}

export async function listUserSessions(db: DatabaseConnection, userId: string): Promise<Session[]> {
  const records = await sessionsRepo.getSessionsByUserId(db, userId);
  return records.map((r) => ({
    id: r.id,
    userId: r.userId,
    expiresAt: r.expiresAt,
    revokedAt: r.revokedAt,
    createdAt: r.createdAt,
  }));
}

export async function cleanupOldSessions(db: DatabaseConnection, userId: string, maxSessions: number): Promise<void> {
  const sessions = await listUserSessions(db, userId);
  const active = sessions.filter((s) => !s.revokedAt && new Date(s.expiresAt) > new Date());
  if (active.length > maxSessions) {
    const toRevoke = active.slice(maxSessions);
    for (const session of toRevoke) {
      await sessionsRepo.revokeSession(db, session.id);
    }
  }
}
