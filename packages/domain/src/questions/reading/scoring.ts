import type { ScoringProfileId } from '@pte-app/contracts';

export interface ReadingScoringProfile {
  id: ScoringProfileId;
  version: number;
  correctCredit: number;
  incorrectDeduction: number;
  minimumResult: number;
  maximumResult: number;
}

export function scoreReadingMultipleChoiceMultiple(
  selectedKeys: string[],
  correctKeys: string[],
  profile: ReadingScoringProfile,
): number {
  const seen = new Set<string>();
  let score = 0;
  for (const key of selectedKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    if (correctKeys.includes(key)) {
      score += profile.correctCredit;
    } else {
      score -= profile.incorrectDeduction;
    }
  }
  return Math.max(profile.minimumResult, Math.min(profile.maximumResult, score));
}

export function scoreReadingMultipleChoiceSingle(
  selectedKey: string | null,
  correctKey: string,
  profile: ReadingScoringProfile,
): number {
  if (selectedKey === null) return 0;
  return selectedKey === correctKey ? profile.correctCredit : profile.minimumResult;
}

export function scoreReadingReorderParagraph(
  orderedIds: string[],
  correctOrder: string[],
  profile: ReadingScoringProfile,
): number {
  if (orderedIds.length === 0) return 0;
  let correctPairs = 0;
  for (let i = 0; i < orderedIds.length - 1; i++) {
    const current = orderedIds[i];
    const next = orderedIds[i + 1];
    if (current === undefined || next === undefined) continue;
    const currentCorrectIndex = correctOrder.indexOf(current);
    const nextCorrectIndex = correctOrder.indexOf(next);
    if (currentCorrectIndex !== -1 && nextCorrectIndex !== -1 && nextCorrectIndex === currentCorrectIndex + 1) {
      correctPairs++;
    }
  }
  const totalPairs = correctOrder.length - 1;
  if (totalPairs === 0) return profile.minimumResult;
  const ratio = correctPairs / totalPairs;
  return Math.max(profile.minimumResult, Math.min(profile.maximumResult, ratio * profile.correctCredit));
}
