import type { ScoringProfileId } from '@pte-app/contracts';

export interface ListeningScoringProfile {
  id: ScoringProfileId;
  version: number;
  correctCredit: number;
  incorrectDeduction: number;
  minimumResult: number;
  maximumResult: number;
}

export function scoreListeningMultipleChoiceMultiple(
  selectedKeys: string[],
  correctKeys: string[],
  profile: ListeningScoringProfile,
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

export function scoreListeningMultipleChoiceSingle(selectedKey: string | null, correctKey: string): number {
  return selectedKey === correctKey ? 1 : 0;
}

export function scoreListeningFillBlanks(
  placements: Record<string, string | null>,
  correctAnswers: Record<string, string>,
): number {
  const gapCount = Object.keys(correctAnswers).length;
  if (gapCount === 0) return 0;
  let correct = 0;
  for (const [gapIndex, answer] of Object.entries(correctAnswers)) {
    if (placements[gapIndex] === answer) correct++;
  }
  return correct / gapCount;
}

export function scoreHighlightIncorrectWords(flaggedIndices: number[], correctIndices: number[]): number {
  if (correctIndices.length === 0) return 0;
  const flaggedSet = new Set(flaggedIndices);
  let correct = 0;
  for (const idx of correctIndices) {
    if (flaggedSet.has(idx)) correct++;
  }
  const precision = flaggedIndices.length > 0 ? correct / flaggedIndices.length : 0;
  const recall = correct / correctIndices.length;
  return precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
}
