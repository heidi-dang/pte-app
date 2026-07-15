import type { StaffCapability } from '@pte-app/contracts';

const roleCapabilities: Record<string, StaffCapability[]> = {
  teacher: [
    'teacher.students.read',
    'teacher.assignments.manage',
    'teacher.responses.review',
    'teacher.feedback.write',
    'teacher.feedback.lock',
  ],
  admin: [
    'admin.users.read',
    'admin.users.manage',
    'admin.entitlements.read',
    'admin.entitlements.manage',
    'admin.content.manage',
    'admin.scoring.support',
    'admin.audit.read',
    'admin.moderation.manage',
    'admin.impersonation.start',
    'admin.impersonation.stop',
    'admin.operations.read',
  ],
};

export function hasCapability(userRole: string, required: StaffCapability): boolean {
  const caps = roleCapabilities[userRole];
  return caps?.includes(required) ?? false;
}
