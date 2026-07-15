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
  let score = 0;
  for (const key of selectedKeys) {
    if (correctKeys.includes(key)) {
      score += profile.correctCredit;
    } else {
      score -= profile.incorrectDeduction;
    }
  }
  return Math.max(profile.minimumResult, Math.min(profile.maximumResult, score));
}

export function scoreReadingMultipleChoiceSingle(selectedKey: string | null, correctKey: string): number {
  return selectedKey === correctKey ? 1 : 0;
}

export function scoreReadingReorderParagraph(orderedIds: string[], correctOrder: string[]): number {
  if (orderedIds.length === 0) return 0;
  let correctPairs = 0;
  for (let i = 0; i < orderedIds.length - 1; i++) {
    const current = orderedIds[i];
    const next = orderedIds[i + 1];
    if (current === undefined || next === undefined) continue;
    const currentIdx = correctOrder.indexOf(current);
    const nextIdx = correctOrder.indexOf(next);
    if (currentIdx !== -1 && nextIdx !== -1 && currentIdx < nextIdx) {
      correctPairs++;
    }
  }
  const totalPairs = correctOrder.length - 1;
  return totalPairs > 0 ? correctPairs / totalPairs : 0;
}
