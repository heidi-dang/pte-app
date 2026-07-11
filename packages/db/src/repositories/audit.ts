import { PrismaClient, AuditAction } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface AppendAuditLogInput {
  userId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}

export function createAuditRepository(db: PrismaClient) {
  return {
    /** Append an immutable audit log entry. */
    async append(input: AppendAuditLogInput) {
      return db.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata,
          ipAddress: input.ipAddress,
        },
      });
    },

    /** Find audit logs for a specific entity. */
    async findForEntity(entityType: string, entityId: string) {
      return db.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
      });
    },

    /** Find audit logs for a specific user. */
    async findForUser(userId: string, take = 50) {
      return db.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take,
      });
    },

    /** Find audit logs by action type with pagination. */
    async findByAction(action: AuditAction, take = 100, skip = 0) {
      return db.auditLog.findMany({
        where: { action },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });
    },
  };
}
