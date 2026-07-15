import { z } from 'zod';
export const ModerationCaseSchema = z.object({
  id: z.string(),
  subjectType: z.string(),
  subjectId: z.string(),
  evidenceReferences: z.array(z.string()),
  status: z.enum(['open', 'triaged', 'in-progress', 'resolved', 'closed']),
  assignment: z.object({ moderatorId: z.string(), assignedAt: z.string() }),
  decision: z.enum(['upheld', 'overturned', 'escalated', 'dismissed']).optional(),
  reason: z.string().optional(),
  reversible: z.boolean(),
  auditTrail: z.array(z.object({ action: z.string(), timestamp: z.string(), actorId: z.string() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});
