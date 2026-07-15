import type { DiagnosticBlueprint, SelectedQuestion } from '@pte-app/contracts';

/**
 * Question selector — deterministic question selection from blueprint.
 */
export function selectQuestions(
  blueprint: DiagnosticBlueprint,
  availableQuestions: Array<{ questionId: string; questionVersionId: string; taskType: string; difficulty: number }>,
): SelectedQuestion[] {
  const selected: SelectedQuestion[] = [];
  let position = 0;

  for (const dist of blueprint.taskDistribution) {
    const candidates = availableQuestions.filter(
      (q) =>
        q.taskType === dist.taskType &&
        q.difficulty >= dist.difficultyRange[0] &&
        q.difficulty <= dist.difficultyRange[1],
    );

    const count = Math.min(dist.count, candidates.length);
    const shuffled =
      blueprint.selectionPolicy.method === 'random' && blueprint.selectionPolicy.seed
        ? seededShuffle(candidates, blueprint.selectionPolicy.seed)
        : candidates;

    for (let i = 0; i < count; i++) {
      const item = shuffled[i];
      if (item) {
        selected.push({
          questionId: item.questionId,
          questionVersionId: item.questionVersionId,
          taskType: dist.taskType,
          section: dist.section,
          difficulty: item.difficulty,
          position: position++,
        });
      }
    }
  }

  return selected;
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentSeed = seed;
  for (let i = result.length - 1; i > 0; i--) {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    const j = currentSeed % (i + 1);
    const temp = result[i];
    const swap = result[j];
    if (temp !== undefined && swap !== undefined) {
      result[i] = swap;
      result[j] = temp;
    }
  }
  return result;
}
