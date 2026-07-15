import { z } from 'zod';
export const StaffCapabilitySchema = z.enum([
  'teacher.students.read',
  'teacher.assignments.manage',
  'teacher.responses.review',
  'teacher.feedback.write',
  'teacher.feedback.lock',
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
]);
export const PermissionCheckSchema = z.object({
  userId: z.string(),
  capability: StaffCapabilitySchema,
  resourceId: z.string().optional(),
});
