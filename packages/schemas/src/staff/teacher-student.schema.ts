import { z } from 'zod';
export const TeacherStudentAssignmentSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  studentId: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  status: z.enum(['active', 'expired', 'removed']),
  auditHistory: z.array(z.object({ action: z.string(), timestamp: z.string(), actorId: z.string() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});
