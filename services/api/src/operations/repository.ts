import type { Notification, SupportCase, RetryOperation } from '@pte-app/contracts';

export interface OperationsRepository {
  findNotifications(userId: string): Promise<Notification[]>;
  findSupportCase(caseId: string): Promise<SupportCase | null>;
  insertRetryRequest(op: RetryOperation): Promise<void>;
}
