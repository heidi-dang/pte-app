import type {
  ScoringProfile,
  ScoringResult,
  ScoringEvidence,
  ScoringInput,
  ScoringRuleDefinition,
} from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

const ENGINE_VERSION = '1.0.0';

interface RuleEvaluation {
  score: number;
  evidence: ScoringEvidence;
}

/**
 * Centralised profile-driven scoring engine.
 * All scoring is governed by explicit rule definitions in the profile.
 * No fixed +1/-1 rules exist.
 */
export function scoreObjective(input: ScoringInput, profile: ScoringProfile, attemptId: string): ScoringResult {
  validateProfile(profile);

  if (input.selectedAnswers === null || input.selectedAnswers === undefined) {
    return createNoResponseResult(input, profile, attemptId);
  }

  const ruleOutputs = evaluateProfileRules(input, profile);
  const rawResult = ruleOutputs.reduce((sum, r) => sum + r.score, 0);
  const normalised = applyNormalisation(rawResult, profile);
  const bounded = applyBounds(normalised, profile);
  const rounded = applyRounding(bounded, profile);

  return {
    resultId: randomUUID(),
    attemptId,
    questionVersionId: input.questionVersionId,
    scoringProfileId: profile.id,
    scoringProfileVersion: profile.version,
    engineVersion: ENGINE_VERSION,
    rawResult,
    boundedResult: rounded,
    componentEvidence: ruleOutputs.map((r) => r.evidence),
    noResponse: false,
    createdAt: new Date().toISOString(),
    resultType: 'original',
  };
}

function validateProfile(profile: ScoringProfile): void {
  if (profile.rules.length === 0) {
    throw new Error('Scoring profile must define at least one rule');
  }
  const knownTypes = new Set<string>([
    'binary-correct-incorrect',
    'multiple-answer-negative-marking',
    'per-blank',
    'per-word',
    'adjacent-pair',
  ]);
  for (const rule of profile.rules) {
    if (!knownTypes.has(rule.ruleType)) {
      throw new Error(`Unsupported rule type: ${rule.ruleType}`);
    }
  }
}

function evaluateProfileRules(input: ScoringInput, profile: ScoringProfile): RuleEvaluation[] {
  const outputs: RuleEvaluation[] = [];

  for (const ruleDef of profile.rules) {
    outputs.push(evaluateRule(ruleDef, input));
  }

  return outputs;
}

function evaluateRule(ruleDef: ScoringRuleDefinition, input: ScoringInput): RuleEvaluation {
  const { params } = ruleDef;
  switch (params.kind) {
    case 'binary':
      return evaluateBinary(params, input);
    case 'multiple-answer':
      return evaluateMultipleAnswer(params, input);
    case 'per-blank':
      return evaluatePerBlank(params, input);
    case 'per-word':
      return evaluatePerWord(params, input);
    case 'adjacent-pair':
      return evaluateAdjacentPair(params, input);
  }
}

function evaluateBinary(
  params: {
    kind: 'binary';
    correctCredit: number;
    incorrectDeduction: number;
    duplicateAction: 'reject' | 'deduplicate' | 'allow';
  },
  input: ScoringInput,
): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const validIds = input.context?.validAnswerIdentifiers as string[] | undefined;

  const scoreCounts: Record<string, number> = {};
  for (const key of selected) {
    scoreCounts[key] = (scoreCounts[key] ?? 0) + 1;
  }

  let effectiveKeys: string[];
  if (params.duplicateAction === 'reject') {
    effectiveKeys = selected.filter((k, i) => selected.indexOf(k) === i);
  } else if (params.duplicateAction === 'deduplicate') {
    effectiveKeys = Object.keys(scoreCounts);
  } else {
    effectiveKeys = selected;
  }

  let score = 0;
  for (const key of effectiveKeys) {
    if (validIds && !validIds.includes(key) && !correct.includes(key)) {
      throw new Error(`Unknown answer identifier: ${key}`);
    }
    if (correct.includes(key)) {
      score += params.correctCredit;
    } else {
      score -= params.incorrectDeduction;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'binary-correct-incorrect',
      description: `Binary scoring: ${score} from ${effectiveKeys.length} effective selections`,
      contribution: score,
      metadata: {
        selectedCount: effectiveKeys.length,
        correctCount: correct.length,
        correctCredit: params.correctCredit,
        incorrectDeduction: params.incorrectDeduction,
        duplicateAction: params.duplicateAction,
      },
    },
  };
}

function evaluateMultipleAnswer(
  params: {
    kind: 'multiple-answer';
    correctCredit: number;
    incorrectDeduction: number;
    duplicateAction: 'reject' | 'deduplicate' | 'allow';
  },
  input: ScoringInput,
): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const validIds = input.context?.validAnswerIdentifiers as string[] | undefined;

  const correctSet = new Set(correct);

  const scoreCounts: Record<string, number> = {};
  for (const key of selected) {
    scoreCounts[key] = (scoreCounts[key] ?? 0) + 1;
  }

  let effectiveKeys: string[];
  if (params.duplicateAction === 'reject') {
    effectiveKeys = selected.filter((k, i) => selected.indexOf(k) === i);
  } else if (params.duplicateAction === 'deduplicate') {
    effectiveKeys = Object.keys(scoreCounts);
  } else {
    effectiveKeys = selected;
  }

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  for (const key of effectiveKeys) {
    if (validIds && !validIds.includes(key) && !correctSet.has(key)) {
      throw new Error(`Unknown answer identifier: ${key}`);
    }
    if (correctSet.has(key)) {
      score += params.correctCredit;
      correctCount++;
    } else {
      score -= params.incorrectDeduction;
      incorrectCount++;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'multiple-answer-negative-marking',
      description: `Multiple-answer: +${correctCount * params.correctCredit} -${incorrectCount * params.incorrectDeduction}`,
      contribution: score,
      metadata: {
        correctSelections: correctCount,
        incorrectSelections: incorrectCount,
        correctCredit: params.correctCredit,
        incorrectDeduction: params.incorrectDeduction,
        duplicateAction: params.duplicateAction,
      },
    },
  };
}

function evaluatePerBlank(
  params: {
    kind: 'per-blank';
    blankCredit: number;
    casePolicy: 'insensitive' | 'sensitive';
    whitespacePolicy: 'collapse' | 'preserve';
  },
  input: ScoringInput,
): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');

  let score = 0;
  const blankResults: boolean[] = [];

  for (let i = 0; i < correct.length; i++) {
    const expected = normaliseBlankAnswer(correct[i] ?? '', params.casePolicy, params.whitespacePolicy);
    const given =
      i < selected.length ? normaliseBlankAnswer(selected[i] ?? '', params.casePolicy, params.whitespacePolicy) : '';
    const matches = expected === given;
    if (matches) {
      score += params.blankCredit;
    }
    blankResults.push(matches);
  }

  return {
    score,
    evidence: {
      ruleType: 'per-blank',
      description: `Per-blank: ${blankResults.filter(Boolean).length}/${correct.length} correct`,
      contribution: score,
      metadata: { blankResults, blankCredit: params.blankCredit },
    },
  };
}

function evaluatePerWord(
  params: {
    kind: 'per-word';
    wordCredit: number;
    casePolicy: 'insensitive' | 'sensitive';
    punctuationPolicy: 'strip' | 'preserve';
  },
  input: ScoringInput,
): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');

  const normalisedCorrect = correct.map((w) => normaliseWord(w, params.casePolicy, params.punctuationPolicy));
  const normalisedSelected = selected.map((w) => normaliseWord(w, params.casePolicy, params.punctuationPolicy));

  const selectedCounts: Record<string, number> = {};
  for (const w of normalisedSelected) {
    selectedCounts[w] = (selectedCounts[w] ?? 0) + 1;
  }

  let score = 0;
  const wordResults: boolean[] = [];

  for (const word of normalisedCorrect) {
    const remaining = selectedCounts[word] ?? 0;
    if (remaining > 0) {
      score += params.wordCredit;
      selectedCounts[word] = remaining - 1;
      wordResults.push(true);
    } else {
      wordResults.push(false);
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'per-word',
      description: `Per-word multiset: ${wordResults.filter(Boolean).length}/${normalisedCorrect.length} correct`,
      contribution: score,
      metadata: { wordResults, wordCredit: params.wordCredit },
    },
  };
}

function evaluateAdjacentPair(
  params: { kind: 'adjacent-pair'; correctCredit: number },
  input: ScoringInput,
): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');

  const correctIndex: Record<string, number> = {};
  for (let i = 0; i < correct.length; i++) {
    const item = correct[i];
    if (item !== undefined) correctIndex[item] = i;
  }

  let score = 0;
  for (let i = 0; i < selected.length - 1; i++) {
    const currentItem = selected[i];
    const nextItem = selected[i + 1];
    if (currentItem === undefined || nextItem === undefined) continue;
    const currentIdx = correctIndex[currentItem];
    const nextIdx = correctIndex[nextItem];
    if (currentIdx !== undefined && nextIdx !== undefined && nextIdx === currentIdx + 1) {
      score += params.correctCredit;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'adjacent-pair',
      description: `Adjacent pairs: ${score / params.correctCredit} correct pairs`,
      contribution: score,
      metadata: { pairCount: selected.length - 1, correctCredit: params.correctCredit },
    },
  };
}

function createNoResponseResult(input: ScoringInput, profile: ScoringProfile, attemptId: string): ScoringResult {
  const result = profile.noResponseBehaviour.result;
  return {
    resultId: randomUUID(),
    attemptId,
    questionVersionId: input.questionVersionId,
    scoringProfileId: profile.id,
    scoringProfileVersion: profile.version,
    engineVersion: ENGINE_VERSION,
    rawResult: result,
    boundedResult: result,
    componentEvidence: [
      {
        ruleType: 'no-response',
        description: `No response submitted: ${result}`,
        contribution: result,
      },
    ],
    noResponse: true,
    createdAt: new Date().toISOString(),
    resultType: 'original',
  };
}

function applyNormalisation(value: number, profile: ScoringProfile): number {
  if (!profile.normalisation.enabled || profile.normalisation.method === 'none') {
    return value;
  }
  if (profile.normalisation.method === 'linear') {
    const mean = profile.normalisation.referenceMean ?? 0;
    const stdDev = profile.normalisation.referenceStdDev ?? 1;
    return stdDev === 0 ? value : (value - mean) / stdDev;
  }
  return value;
}

function applyBounds(value: number, profile: ScoringProfile): number {
  return Math.max(profile.minimumResult, Math.min(profile.maximumResult, value));
}

function applyRounding(value: number, profile: ScoringProfile): number {
  const { method, decimalPlaces } = profile.rounding;
  if (method === 'none' || decimalPlaces === 0) return value;
  const factor = Math.pow(10, decimalPlaces);
  switch (method) {
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

function validateStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  for (const item of value) {
    if (typeof item !== 'string') {
      throw new Error(`${fieldName} must be an array of strings`);
    }
  }
  return value;
}

function normaliseBlankAnswer(value: string, casePolicy: string, whitespacePolicy: string): string {
  let result = value;
  if (casePolicy === 'insensitive') {
    result = result.toLowerCase();
  }
  if (whitespacePolicy === 'collapse') {
    result = result.replace(/\s+/g, ' ').trim();
  }
  return result;
}

function normaliseWord(value: string, casePolicy: string, punctuationPolicy: string): string {
  let result = value;
  if (casePolicy === 'insensitive') {
    result = result.toLowerCase();
  }
  if (punctuationPolicy === 'strip') {
    result = result.replace(/[^\w\s]/g, '');
  }
  return result.replace(/\s+/g, ' ').trim();
}
