export type StaffCapability =
  | 'teacher.students.read'
  | 'teacher.assignments.manage'
  | 'teacher.responses.review'
  | 'teacher.feedback.write'
  | 'teacher.feedback.lock'
  | 'admin.users.read'
  | 'admin.users.manage'
  | 'admin.entitlements.read'
  | 'admin.entitlements.manage'
  | 'admin.content.manage'
  | 'admin.scoring.support'
  | 'admin.audit.read'
  | 'admin.moderation.manage'
  | 'admin.impersonation.start'
  | 'admin.impersonation.stop'
  | 'admin.operations.read';

export interface PermissionCheck {
  userId: string;
  capability: StaffCapability;
  resourceId?: string;
}
