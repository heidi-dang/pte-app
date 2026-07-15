import type { ScoringProfile, ScoringResult, ScoringEvidence, ScoringInput } from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

const ENGINE_VERSION = '1.0.0';

/**
 * Centralised objective scoring engine.
 * All deterministic scoring goes through this engine.
 */
export function scoreObjective(input: ScoringInput, profile: ScoringProfile, attemptId: string): ScoringResult {
  if (input.selectedAnswers === null || input.selectedAnswers === undefined) {
    return createNoResponseResult(input, profile, attemptId);
  }

  const ruleOutputs = evaluateRules(input);
  const rawResult = ruleOutputs.reduce((sum, r) => sum + r.score, 0);
  const boundedResult = boundResult(rawResult, profile);
  const roundedResult = roundResult(boundedResult, profile.rounding);

  return {
    resultId: randomUUID(),
    attemptId,
    questionVersionId: input.questionVersionId,
    scoringProfileId: profile.id,
    scoringProfileVersion: profile.version,
    engineVersion: ENGINE_VERSION,
    rawResult,
    boundedResult: roundedResult,
    componentEvidence: ruleOutputs.map((r) => r.evidence),
    noResponse: false,
    createdAt: new Date().toISOString(),
    resultType: 'original',
  };
}

function createNoResponseResult(input: ScoringInput, profile: ScoringProfile, attemptId: string): ScoringResult {
  return {
    resultId: randomUUID(),
    attemptId,
    questionVersionId: input.questionVersionId,
    scoringProfileId: profile.id,
    scoringProfileVersion: profile.version,
    engineVersion: ENGINE_VERSION,
    rawResult: profile.noResponseBehaviour.result,
    boundedResult: profile.noResponseBehaviour.result,
    componentEvidence: [
      {
        ruleType: 'no-response',
        description: 'No response submitted',
        contribution: profile.noResponseBehaviour.result,
      },
    ],
    noResponse: true,
    createdAt: new Date().toISOString(),
    resultType: 'original',
  };
}

function evaluateRules(input: ScoringInput): Array<{ score: number; evidence: ScoringEvidence }> {
  const outputs: Array<{ score: number; evidence: ScoringEvidence }> = [];

  if (input.taskType === 'reorder_paragraph') {
    outputs.push(evaluateAdjacentPair(input));
  } else if (Array.isArray(input.selectedAnswers) && Array.isArray(input.correctAnswers)) {
    outputs.push(evaluateCorrectIncorrect(input));
  }

  return outputs;
}

function evaluateCorrectIncorrect(input: ScoringInput): { score: number; evidence: ScoringEvidence } {
  const selected = input.selectedAnswers as string[];
  const correct = input.correctAnswers as string[];
  const seen = new Set<string>();
  let score = 0;

  for (const key of selected) {
    if (seen.has(key)) continue;
    seen.add(key);
    if (correct.includes(key)) {
      score += 1;
    } else {
      score -= 1;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'correct-incorrect',
      description: `Scored ${score} from ${selected.length} selections`,
      contribution: score,
      metadata: { selectedCount: selected.length, correctCount: correct.length },
    },
  };
}

function evaluateAdjacentPair(input: ScoringInput): { score: number; evidence: ScoringEvidence } {
  const selected = input.selectedAnswers as string[];
  const correct = input.correctAnswers as string[];
  let score = 0;

  for (let i = 0; i < selected.length - 1; i++) {
    const currentItem = selected[i];
    const nextItem = selected[i + 1];
    if (currentItem === undefined || nextItem === undefined) continue;
    const currentIdx = correct.indexOf(currentItem);
    const nextIdx = correct.indexOf(nextItem);
    if (currentIdx !== -1 && nextIdx !== -1 && nextIdx === currentIdx + 1) {
      score += 1;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'adjacent-pair',
      description: `Scored ${score} adjacent pairs`,
      contribution: score,
      metadata: { pairCount: selected.length - 1 },
    },
  };
}

function boundResult(raw: number, profile: ScoringProfile): number {
  return Math.max(profile.minimumResult, Math.min(profile.maximumResult, raw));
}

function roundResult(value: number, rounding: { method: string; decimalPlaces: number }): number {
  if (rounding.method === 'none' || rounding.decimalPlaces === 0) return value;
  const factor = Math.pow(10, rounding.decimalPlaces);
  switch (rounding.method) {
    case 'floor':
      return Math.floor(value * factor) / factor;
    case 'ceil':
      return Math.ceil(value * factor) / factor;
    case 'round':
      return Math.round(value * factor) / factor;
    default:
      return value;
  }
}
