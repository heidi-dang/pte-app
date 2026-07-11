import { PrismaClient } from '@prisma/client';

export interface CreateSessionInput {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export function createSessionsRepository(db: PrismaClient) {
  return {
    /** Create a new session token. */
    async createSession(input: CreateSessionInput) {
      return db.session.create({
        data: {
          userId: input.userId,
          token: input.token,
          expiresAt: input.expiresAt,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    },

    /** Find an active (non-invalidated, non-expired) session by token. */
    async findActiveSession(token: string) {
      return db.session.findFirst({
        where: {
          token,
          invalidatedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              roles: { include: { role: true } },
              profile: true,
            },
          },
        },
      });
    },

    /** Invalidate a session immediately (logout). */
    async invalidateSession(token: string) {
      return db.session.updateMany({
        where: { token },
        data: { invalidatedAt: new Date() },
      });
    },

    /** Invalidate all sessions for a user (e.g. password change, account suspension). */
    async invalidateAllUserSessions(userId: string) {
      return db.session.updateMany({
        where: { userId, invalidatedAt: null },
        data: { invalidatedAt: new Date() },
      });
    },

    /** Remove expired sessions older than a given date (housekeeping). */
    async pruneExpiredSessions(before: Date) {
      return db.session.deleteMany({
        where: { expiresAt: { lt: before } },
      });
    },
  };
}
