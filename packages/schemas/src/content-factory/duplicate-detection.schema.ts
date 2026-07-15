import { z } from 'zod';
export const DuplicateDetectionProfileSchema = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  textSimilarityThreshold: z.number().min(0).max(1),
  mediaFingerprintEnabled: z.boolean(),
  exactMatchRequired: z.boolean(),
  includeNearDuplicates: z.boolean(),
  humanResolutionRequired: z.boolean(),
});
export const DuplicateMatchSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  matchedContentId: z.string(),
  matchType: z.enum(['exact', 'near', 'related']),
  similarityScore: z.number().min(0).max(1),
  status: z.enum(['unresolved', 'confirmed', 'false-positive']),
  resolution: z.enum(['keep', 'flag', 'reject']).optional(),
  resolvedById: z.string().optional(),
  resolvedAt: z.string().optional(),
});
