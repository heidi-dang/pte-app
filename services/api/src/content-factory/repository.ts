import type { ContentDraft } from '@pte-app/contracts';

export interface ContentFactoryRepository {
  findDraft(draftId: string): Promise<ContentDraft | null>;
  updateDraft(draft: ContentDraft): Promise<void>;
  listDrafts(authorId: string): Promise<ContentDraft[]>;
}
