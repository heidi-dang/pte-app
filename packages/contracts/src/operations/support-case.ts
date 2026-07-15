export type SupportCaseState =
  | 'open'
  | 'triaged'
  | 'in-progress'
  | 'waiting-for-student'
  | 'waiting-for-internal'
  | 'resolved'
  | 'closed'
  | 'reopened';

export interface SupportCase {
  id: string;
  userId: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject: string;
  description: string;
  relatedAttemptIds: string[];
  relatedJobIds: string[];
  relatedMediaIds: string[];
  assignedAgentId?: string;
  status: SupportCaseState;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}
