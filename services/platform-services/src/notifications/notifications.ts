/**
 * Phase W — Notifications, Support and Operations
 */

export type NotificationChannel = 'email' | 'in_app';

export interface Notification {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly body: string;
  readonly channel: NotificationChannel;
  readonly read: boolean;
  readonly createdAt: string;
}

export class NotificationService {
  async send(userId: string, title: string, body: string, channel: NotificationChannel): Promise<Notification> {
    return {
      id: `notif_${Date.now().toString(36)}`,
      userId,
      title,
      body,
      channel,
      read: false,
      createdAt: new Date().toISOString(),
    };
  }

  async list(userId: string): Promise<Notification[]> {
    return [];
  }

  async markRead(notificationId: string): Promise<void> {}
}
