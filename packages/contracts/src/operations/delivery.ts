export interface DeliveryRecord {
  id: string;
  notificationId: string;
  providerId: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  providerMessageId?: string;
  attemptedAt: string;
  deliveredAt?: string;
  error?: string;
}
