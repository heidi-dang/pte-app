import { z } from 'zod';
export const TeacherFeedbackSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  teacherId: z.string(),
  writtenFeedback: z.string().optional(),
  audioFeedbackMediaId: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'revised', 'withdrawn']),
  version: z.number().int(),
  versionHistory: z.array(z.object({ version: z.number().int(), content: z.string(), updatedAt: z.string() })),
  author: z.string(),
  studentVisible: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
