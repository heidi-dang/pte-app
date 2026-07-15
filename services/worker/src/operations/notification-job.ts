import type { Notification } from '@pte-app/contracts';
export async function processNotification(_notification: Notification): Promise<void> {
  if (notification.status !== 'queued' && notification.status !== 'retrying') return;
}
