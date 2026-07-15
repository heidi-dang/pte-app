export interface ModerationCase {
  id: string;
  subjectType: string;
  subjectId: string;
  evidenceReferences: string[];
  status: 'open' | 'triaged' | 'in-progress' | 'resolved' | 'closed';
  assignment: { moderatorId: string; assignedAt: string };
  decision?: 'upheld' | 'overturned' | 'escalated' | 'dismissed';
  reason?: string;
  reversible: boolean;
  auditTrail: Array<{ action: string; timestamp: string; actorId: string }>;
  createdAt: string;
  updatedAt: string;
}
