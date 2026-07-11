import type { ScoringInput, ScoringResult, TraitResult, ScoringProfile } from './types.js';

export class ObjectiveScorer {
  score(input: ScoringInput): ScoringResult {
    const { profile, correctAnswer, studentResponse } = input;
    const traits: Record<string, TraitResult> = {};
    const evidence: Record<string, unknown> = {};
    let totalScore = 0;
    let totalMax = 0;

    for (const rule of profile.rules) {
      const result = this.scoreTrait(rule.trait, correctAnswer, studentResponse, profile);
      traits[rule.trait] = result;
      totalScore += result.score;
      totalMax += result.maxScore;
      evidence[rule.trait] = { correct: true, partial: result.score < result.maxScore && result.score > 0 };
    }

    // Apply no-response rule
    if (this.isNoResponse(studentResponse)) {
      totalScore = profile.noResponseScore;
    }

    // Apply negative marking floor
    totalScore = Math.max(profile.itemMinScore, totalScore);

    return {
      score: totalScore,
      maxScore: totalMax,
      percentage: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
      traits,
      evidence,
      profileVersion: profile.version,
    };
  }

  private scoreTrait(
    trait: string,
    correct: Record<string, unknown>,
    response: Record<string, unknown>,
    profile: ScoringProfile,
  ): TraitResult {
    switch (trait) {
      case 'exact_match':
        return this.scoreExactMatch(correct, response);
      case 'per_blank':
        return this.scorePerBlank(correct, response, profile);
      case 'per_word':
        return this.scorePerWord(correct, response, profile);
      case 'adjacent_pairs':
        return this.scoreAdjacentPairs(correct, response);
      case 'selected_options':
        return this.scoreSelectedOptions(correct, response, profile);
      default:
        return { score: 0, maxScore: 1, details: `Unknown trait: ${trait}` };
    }
  }

  private isNoResponse(response: Record<string, unknown>): boolean {
    return (
      Object.keys(response).length === 0 ||
      Object.values(response).every((v) => v === null || v === '' || (Array.isArray(v) && v.length === 0))
    );
  }

  private scoreExactMatch(correct: Record<string, unknown>, response: Record<string, unknown>): TraitResult {
    const key = (correct.key as string) ?? 'answer';
    const correctVal = String(correct[key] ?? '');
    const responseVal = String(response[key] ?? '');
    const match = correctVal.toLowerCase().trim() === responseVal.toLowerCase().trim();
    return { score: match ? 1 : 0, maxScore: 1, details: match ? 'Correct' : 'Incorrect' };
  }

  private scorePerBlank(
    correct: Record<string, unknown>,
    response: Record<string, unknown>,
    profile: ScoringProfile,
  ): TraitResult {
    const correctBlanks = (correct.blanks ?? correct.answers ?? []) as string[];
    const responseBlanks = (response.blanks ?? response.answers ?? []) as string[];
    let score = 0;
    const maxScore = correctBlanks.length;

    for (let i = 0; i < correctBlanks.length && i < responseBlanks.length; i++) {
      if (
        String(correctBlanks[i] ?? '')
          .toLowerCase()
          .trim() ===
        String(responseBlanks[i] ?? '')
          .toLowerCase()
          .trim()
      ) {
        score++;
      }
    }

    return { score, maxScore, details: `${score}/${maxScore} blanks correct` };
  }

  private scorePerWord(
    correct: Record<string, unknown>,
    response: Record<string, unknown>,
    _profile: ScoringProfile,
  ): TraitResult {
    const correctWords = ((correct.text ?? correct.dictation ?? '') as string).trim().split(/\s+/);
    const responseWords = ((response.text ?? response.dictation ?? '') as string).trim().split(/\s+/).filter(Boolean);
    let score = 0;
    const maxScore = correctWords.length;

    for (let i = 0; i < correctWords.length && i < responseWords.length; i++) {
      if (correctWords[i]?.toLowerCase() === responseWords[i]?.toLowerCase()) {
        score++;
      }
    }

    return { score, maxScore, details: `${score}/${maxScore} words correct` };
  }

  private scoreAdjacentPairs(correct: Record<string, unknown>, response: Record<string, unknown>): TraitResult {
    const correctOrder = (correct.order ?? correct.paragraphs ?? []) as unknown[];
    const responseOrder = (response.order ?? []) as unknown[];
    let pairs = 0;
    const maxPairs = Math.max(0, correctOrder.length - 1);

    for (let i = 0; i < maxPairs; i++) {
      const ci = responseOrder.indexOf(correctOrder[i]);
      const cj = responseOrder.indexOf(correctOrder[i + 1]);
      if (ci >= 0 && cj >= 0 && cj === ci + 1) {
        pairs++;
      }
    }

    return { score: pairs, maxScore: maxPairs, details: `${pairs}/${maxPairs} adjacent pairs correct` };
  }

  private scoreSelectedOptions(
    correct: Record<string, unknown>,
    response: Record<string, unknown>,
    profile: ScoringProfile,
  ): TraitResult {
    const correctOptions = (correct.selected ?? correct.options ?? []) as unknown[];
    const selected = (response.selected ?? []) as unknown[];
    const correctSet = new Set(correctOptions.map(String));
    const selectedSet = new Set(selected.map(String));

    let correctCount = 0;
    let incorrectCount = 0;

    for (const s of selectedSet) {
      if (correctSet.has(s)) correctCount++;
      else incorrectCount++;
    }

    const maxScore = correctSet.size;
    let score = correctCount;
    if (profile.negativeMarking) {
      score = Math.max(profile.itemMinScore, correctCount - incorrectCount);
    }

    return { score, maxScore, details: `${correctCount} correct, ${incorrectCount} incorrect` };
  }
}
