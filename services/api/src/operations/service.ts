import type { Notification, SupportCase, RetryOperation } from '@pte-app/contracts';
import type { OperationsRepository } from './repository.js';

export class OperationsService {
  constructor(private repo: OperationsRepository) {}

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.repo.findNotifications(userId);
  }

  async getSupportCase(caseId: string): Promise<SupportCase | null> {
    return this.repo.findSupportCase(caseId);
  }

  async createRetryRequest(op: RetryOperation): Promise<void> {
    return this.repo.insertRetryRequest(op);
  }
}
