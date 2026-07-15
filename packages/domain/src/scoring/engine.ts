import type {
  ScoringProfile,
  ScoringResult,
  ScoringEvidence,
  ScoringInput,
  ScoringRuleDefinition,
} from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

const ENGINE_VERSION = '1.0.0';

export class ScoringValidationError extends Error {
  code: 'DUPLICATE_SELECTION' | 'UNKNOWN_ANSWER_IDENTIFIER' | 'INVALID_SCORING_INPUT' | 'RULE_CONFIGURATION_MISMATCH';

  constructor(code: ScoringValidationError['code'], message: string) {
    super(message);
    this.name = 'ScoringValidationError';
    this.code = code;
  }
}

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
    throw new ScoringValidationError('RULE_CONFIGURATION_MISMATCH', 'Scoring profile must define at least one rule');
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
      throw new ScoringValidationError('RULE_CONFIGURATION_MISMATCH', `Unsupported rule type: ${rule.ruleType}`);
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
  switch (ruleDef.ruleType) {
    case 'binary-correct-incorrect':
      return evaluateBinary(ruleDef, input);
    case 'multiple-answer-negative-marking':
      return evaluateMultipleAnswer(ruleDef, input);
    case 'per-blank':
      return evaluatePerBlank(ruleDef, input);
    case 'per-word':
      return evaluatePerWord(ruleDef, input);
    case 'adjacent-pair':
      return evaluateAdjacentPair(ruleDef, input);
  }
}

function findDuplicate(selected: string[]): string | undefined {
  const seen = new Set<string>();
  for (const key of selected) {
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return undefined;
}

function evaluateBinary(
  rule: ScoringRuleDefinition & { ruleType: 'binary-correct-incorrect' },
  input: ScoringInput,
): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const validIds = input.context?.validAnswerIdentifiers as string[] | undefined;

  if (rule.duplicateAction === 'reject') {
    const dup = findDuplicate(selected);
    if (dup !== undefined) {
      throw new ScoringValidationError('DUPLICATE_SELECTION', `Duplicate selection: ${dup}`);
    }
  }

  const effectiveKeys = buildEffectiveKeys(selected, rule.duplicateAction);

  let score = 0;
  for (const key of effectiveKeys) {
    if (validIds && !validIds.includes(key) && !correct.includes(key)) {
      throw new ScoringValidationError('UNKNOWN_ANSWER_IDENTIFIER', `Unknown answer identifier: ${key}`);
    }
    if (correct.includes(key)) {
      score += rule.correctCredit;
    } else {
      score -= rule.incorrectDeduction;
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
        correctCredit: rule.correctCredit,
        incorrectDeduction: rule.incorrectDeduction,
        duplicateAction: rule.duplicateAction,
      },
    },
  };
}

function evaluateMultipleAnswer(
  rule: ScoringRuleDefinition & { ruleType: 'multiple-answer-negative-marking' },
  input: ScoringInput,
): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const validIds = input.context?.validAnswerIdentifiers as string[] | undefined;

  if (rule.duplicateAction === 'reject') {
    const dup = findDuplicate(selected);
    if (dup !== undefined) {
      throw new ScoringValidationError('DUPLICATE_SELECTION', `Duplicate selection: ${dup}`);
    }
  }

  const effectiveKeys = buildEffectiveKeys(selected, rule.duplicateAction);
  const correctSet = new Set(correct);

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  for (const key of effectiveKeys) {
    if (validIds && !validIds.includes(key) && !correctSet.has(key)) {
      throw new ScoringValidationError('UNKNOWN_ANSWER_IDENTIFIER', `Unknown answer identifier: ${key}`);
    }
    if (correctSet.has(key)) {
      score += rule.correctCredit;
      correctCount++;
    } else {
      score -= rule.incorrectDeduction;
      incorrectCount++;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'multiple-answer-negative-marking',
      description: `Multiple-answer: +${correctCount * rule.correctCredit} -${incorrectCount * rule.incorrectDeduction}`,
      contribution: score,
      metadata: {
        correctSelections: correctCount,
        incorrectSelections: incorrectCount,
        correctCredit: rule.correctCredit,
        incorrectDeduction: rule.incorrectDeduction,
        duplicateAction: rule.duplicateAction,
      },
    },
  };
}

function buildEffectiveKeys(selected: string[], duplicateAction: 'reject' | 'deduplicate' | 'allow'): string[] {
  if (duplicateAction === 'deduplicate') {
    return selected.filter((k, i) => selected.indexOf(k) === i);
  }
  return selected;
}

function evaluatePerBlank(
  rule: ScoringRuleDefinition & { ruleType: 'per-blank' },
  input: ScoringInput,
): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');

  let score = 0;
  const blankResults: boolean[] = [];

  for (let i = 0; i < correct.length; i++) {
    const expected = normaliseBlankAnswer(correct[i] ?? '', rule.casePolicy, rule.whitespacePolicy);
    const given =
      i < selected.length ? normaliseBlankAnswer(selected[i] ?? '', rule.casePolicy, rule.whitespacePolicy) : '';
    const matches = expected === given;
    if (matches) {
      score += rule.blankCredit;
    }
    blankResults.push(matches);
  }

  return {
    score,
    evidence: {
      ruleType: 'per-blank',
      description: `Per-blank: ${blankResults.filter(Boolean).length}/${correct.length} correct`,
      contribution: score,
      metadata: { blankResults, blankCredit: rule.blankCredit },
    },
  };
}

function evaluatePerWord(rule: ScoringRuleDefinition & { ruleType: 'per-word' }, input: ScoringInput): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');

  const normalisedCorrect = correct.map((w) => normaliseWord(w, rule.casePolicy, rule.punctuationPolicy));
  const normalisedSelected = selected.map((w) => normaliseWord(w, rule.casePolicy, rule.punctuationPolicy));

  const selectedCounts: Record<string, number> = {};
  for (const w of normalisedSelected) {
    selectedCounts[w] = (selectedCounts[w] ?? 0) + 1;
  }

  let score = 0;
  const wordResults: boolean[] = [];

  for (const word of normalisedCorrect) {
    const remaining = selectedCounts[word] ?? 0;
    if (remaining > 0) {
      score += rule.wordCredit;
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
      metadata: { wordResults, wordCredit: rule.wordCredit },
    },
  };
}

function evaluateAdjacentPair(
  rule: ScoringRuleDefinition & { ruleType: 'adjacent-pair' },
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
      score += rule.correctCredit;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'adjacent-pair',
      description: `Adjacent pairs: ${score / rule.correctCredit} correct pairs`,
      contribution: score,
      metadata: { pairCount: selected.length - 1, correctCredit: rule.correctCredit },
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
    throw new ScoringValidationError('INVALID_SCORING_INPUT', `${fieldName} must be an array`);
  }
  for (const item of value) {
    if (typeof item !== 'string') {
      throw new ScoringValidationError('INVALID_SCORING_INPUT', `${fieldName} must be an array of strings`);
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
