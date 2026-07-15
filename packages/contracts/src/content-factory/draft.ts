export type ContentLifecycleState =
  | 'draft'
  | 'imported'
  | 'generating-assistance'
  | 'ready-for-validation'
  | 'validating'
  | 'validation-failed'
  | 'ready-for-review'
  | 'in-review'
  | 'changes-requested'
  | 'approved'
  | 'publication-queued'
  | 'published'
  | 'retired'
  | 'rejected'
  | 'archived';

export interface ContentDraft {
  id: string;
  title: string;
  taskType: string;
  body: Record<string, unknown>;
  lifecycleState: ContentLifecycleState;
  version: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}
