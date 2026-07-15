import type { StaffUserAdminAction } from '@pte-app/contracts';

export function recordAdminAction(
  targetUserId: string,
  action: StaffUserAdminAction['action'],
  reason: string,
  actorId: string,
): StaffUserAdminAction {
  return {
    id: crypto.randomUUID(),
    targetUserId,
    action,
    reason,
    actorId,
    createdAt: new Date().toISOString(),
  };
}
