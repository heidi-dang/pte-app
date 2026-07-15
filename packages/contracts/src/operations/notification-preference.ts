export interface NotificationPreference {
  id: string;
  userId: string;
  channel: 'email' | 'in-app' | 'sms';
  category: string;
  enabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  locale: string;
  digestPolicy: 'immediate' | 'daily' | 'weekly';
  version: number;
  effectiveDate: string;
  mandatory: boolean;
}
