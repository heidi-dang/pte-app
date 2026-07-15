import { z } from 'zod';
export const ReviewerAssignmentSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  reviewerId: z.string(),
  conflictOfInterest: z.boolean(),
  status: z.enum(['assigned', 'accepted', 'declined', 'completed']),
  dueDate: z.string().optional(),
  assignedAt: z.string(),
  completedAt: z.string().optional(),
});
export const ReviewDecisionSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  reviewerId: z.string(),
  decision: z.enum(['approved', 'changes-requested', 'rejected']),
  reason: z.string(),
  changeRequest: z.string().optional(),
  version: z.number().int(),
  createdAt: z.string(),
});
