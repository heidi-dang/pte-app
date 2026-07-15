export interface ImpersonationSession {
  id: string;
  impersonatorId: string;
  targetUserId: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  endedAt?: string;
  status: 'active' | 'expired' | 'ended';
  auditEvents: Array<{ event: string; timestamp: string }>;
}
