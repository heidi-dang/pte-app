import type { ScoringProfileId } from '@pte-app/contracts';

export interface ListeningScoringProfile {
  id: ScoringProfileId;
  version: number;
  correctCredit: number;
  incorrectDeduction: number;
  minimumResult: number;
  maximumResult: number;
  /** Case-sensitive comparison for fill-blank answers. Defaults to false. */
  caseSensitive?: boolean;
}

export function scoreListeningMultipleChoiceMultiple(
  selectedKeys: string[],
  correctKeys: string[],
  profile: ListeningScoringProfile,
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

export function scoreListeningMultipleChoiceSingle(
  selectedKey: string | null,
  correctKey: string,
  profile: ListeningScoringProfile,
): number {
  if (selectedKey === null) return 0;
  return selectedKey === correctKey ? profile.correctCredit : profile.minimumResult;
}

export function scoreListeningFillBlanks(
  placements: Record<string, string | null>,
  correctAnswers: Record<string, string>,
  profile: ListeningScoringProfile,
): number {
  const gapCount = Object.keys(correctAnswers).length;
  if (gapCount === 0) return profile.minimumResult;
  const caseSensitive = profile.caseSensitive ?? false;
  let correct = 0;
  for (const [gapIndex, answer] of Object.entries(correctAnswers)) {
    const placed = placements[gapIndex];
    if (placed === null || placed === undefined) continue;
    if (caseSensitive ? placed === answer : placed.toLowerCase() === answer.toLowerCase()) {
      correct++;
    }
  }
  const ratio = correct / gapCount;
  return Math.max(profile.minimumResult, Math.min(profile.maximumResult, ratio * profile.correctCredit));
}

export function scoreHighlightIncorrectWords(
  flaggedIndices: number[],
  correctIndices: number[],
  profile: ListeningScoringProfile,
): number {
  if (correctIndices.length === 0) return profile.minimumResult;
  const flaggedSet = new Set(flaggedIndices);
  let correct = 0;
  for (const idx of correctIndices) {
    if (flaggedSet.has(idx)) correct++;
  }
  const precision = flaggedIndices.length > 0 ? correct / flaggedIndices.length : 0;
  const recall = correct / correctIndices.length;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return Math.max(profile.minimumResult, Math.min(profile.maximumResult, f1 * profile.correctCredit));
}
