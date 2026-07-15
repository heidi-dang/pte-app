export interface NotificationTemplate {
  id: string;
  version: number;
  channel: string;
  subject?: string;
  body: string;
  locale: string;
  variables: string[];
  createdAt: string;
}
