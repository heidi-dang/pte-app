import { z } from 'zod';
export const ContentLifecycleStateSchema = z.enum([
  'draft',
  'imported',
  'generating-assistance',
  'ready-for-validation',
  'validating',
  'validation-failed',
  'ready-for-review',
  'in-review',
  'changes-requested',
  'approved',
  'publication-queued',
  'published',
  'retired',
  'rejected',
  'archived',
]);
export const ContentDraftSchema = z.object({
  id: z.string(),
  title: z.string(),
  taskType: z.string(),
  body: z.record(z.unknown()),
  lifecycleState: ContentLifecycleStateSchema,
  version: z.number().int(),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
