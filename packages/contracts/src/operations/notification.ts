export interface Notification {
  id: string;
  userId: string;
  type: string;
  templateVersion: number;
  payload: Record<string, unknown>;
  channel: 'email' | 'in-app' | 'sms';
  preferenceCategory: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status:
    'queued' | 'scheduled' | 'rendering' | 'sending' | 'delivered' | 'retrying' | 'failed' | 'suppressed' | 'cancelled';
  scheduledAt?: string;
  deliveryAttempts: number;
  providerReference?: string;
  correlationId: string;
  createdAt: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
}
