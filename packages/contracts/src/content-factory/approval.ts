export interface ApprovalRecord {
  id: string;
  contentId: string;
  approverId: string;
  isAuthor: boolean;
  separationRequired: boolean;
  separationViolation: boolean;
  reason: string;
  version: number;
  approvedAt: string;
}
