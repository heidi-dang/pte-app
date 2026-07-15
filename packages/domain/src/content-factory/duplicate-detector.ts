import type { DuplicateMatch, DuplicateDetectionProfile } from '@pte-app/contracts';

export function detectExactDuplicate(
  content: string,
  existing: string[],
  profile: DuplicateDetectionProfile,
): DuplicateMatch | undefined {
  if (!profile.exactMatchRequired) return undefined;
  const match = existing.find((e) => e === content);
  if (!match) return undefined;
  return {
    id: crypto.randomUUID(),
    contentId: 'new',
    matchedContentId: 'existing',
    matchType: 'exact',
    similarityScore: 1,
    status: 'unresolved',
  };
}
