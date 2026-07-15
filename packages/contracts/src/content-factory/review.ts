export interface ReviewerAssignment {
  id: string;
  contentId: string;
  reviewerId: string;
  conflictOfInterest: boolean;
  status: 'assigned' | 'accepted' | 'declined' | 'completed';
  dueDate?: string;
  assignedAt: string;
  completedAt?: string;
}

export interface ReviewDecision {
  id: string;
  contentId: string;
  reviewerId: string;
  decision: 'approved' | 'changes-requested' | 'rejected';
  reason: string;
  changeRequest?: string;
  version: number;
  createdAt: string;
}
