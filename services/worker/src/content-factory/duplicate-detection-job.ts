import type { DuplicateDetectionProfile, DuplicateMatch } from '@pte-app/contracts';
export async function runDuplicateDetection(
  _content: string,
  _existing: string[],
  _profile: DuplicateDetectionProfile,
): Promise<DuplicateMatch[]> {
  return [];
}
