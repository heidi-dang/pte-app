export interface ScoringSupportAction {
  id: string;
  jobId: string;
  action: 'inspect' | 'retry' | 'cancel' | 'mark-for-review';
  status: 'requested' | 'completed' | 'failed' | 'rejected';
  originalResponsePreserved: boolean;
  newJobReference?: string;
  reason: string;
  actorId: string;
  createdAt: string;
}
