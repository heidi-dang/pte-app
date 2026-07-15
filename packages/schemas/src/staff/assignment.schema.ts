import { z } from 'zod';
export const TeacherAssignmentSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  title: z.string(),
  instructions: z.string(),
  contentReferences: z.array(z.string()),
  assignedStudentIds: z.array(z.string()),
  dueDateProfile: z.object({
    dueAt: z.string(),
    allowLateSubmission: z.boolean(),
    lateCutoffAt: z.string().optional(),
  }),
  availabilityPeriod: z.object({ startAt: z.string(), endAt: z.string() }),
  completionPolicy: z.enum(['all', 'minimum', 'optional']),
  version: z.number().int(),
  status: z.enum(['draft', 'published', 'closed', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const AssignmentTargetSchema = z.object({
  assignmentId: z.string(),
  studentId: z.string(),
  status: z.enum(['assigned', 'started', 'submitted', 'graded', 'late']),
  submittedAt: z.string().optional(),
  responseReferences: z.array(z.string()),
});
