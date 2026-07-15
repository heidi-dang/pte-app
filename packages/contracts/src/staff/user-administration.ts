export interface StaffUserAdminAction {
  id: string;
  targetUserId: string;
  action:
    | 'status-change'
    | 'role-assignment'
    | 'capability-update'
    | 'profile-review'
    | 'account-restriction'
    | 'account-restore';
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  reason: string;
  actorId: string;
  createdAt: string;
}
