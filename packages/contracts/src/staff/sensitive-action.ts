export interface SensitiveActionConfirmation {
  id: string;
  actionType: string;
  reason: string;
  expectedTargetState: Record<string, unknown>;
  idempotencyKey: string;
  status: 'pending' | 'confirmed' | 'executed' | 'stale-rejected';
  auditEventId?: string;
  expiresAt: string;
  confirmedAt?: string;
  confirmedById?: string;
  createdAt: string;
}
