import type { ContentDraft, ContentLifecycleState } from '@pte-app/contracts';
import type { ContentFactoryRepository } from './repository.js';

export class ContentFactoryService {
  constructor(private repo: ContentFactoryRepository) {}

  async getDraft(draftId: string): Promise<ContentDraft | null> {
    return this.repo.findDraft(draftId);
  }

  async transitionDraft(draftId: string, to: ContentLifecycleState): Promise<ContentDraft> {
    const draft = await this.repo.findDraft(draftId);
    if (!draft) throw new Error('Draft not found');
    const updated = { ...draft, lifecycleState: to, updatedAt: new Date().toISOString() };
    await this.repo.updateDraft(updated);
    return updated;
  }
}
