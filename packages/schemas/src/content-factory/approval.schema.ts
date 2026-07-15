import { z } from 'zod';
export const ApprovalRecordSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  approverId: z.string(),
  isAuthor: z.boolean(),
  separationRequired: z.boolean(),
  separationViolation: z.boolean(),
  reason: z.string(),
  version: z.number().int(),
  approvedAt: z.string(),
});
