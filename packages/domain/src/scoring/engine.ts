import type {
  ScoringProfile,
  ScoringResult,
  ScoringEvidence,
  ScoringInput,
  ScoringRuleDefinition,
  ScoringRuleParams,
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
    'no-response',
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
    if (ruleDef.ruleType === 'no-response') continue;
    outputs.push(evaluateRule(ruleDef, input));
  }

  return outputs;
}

function evaluateRule(ruleDef: ScoringRuleDefinition, input: ScoringInput): RuleEvaluation {
  switch (ruleDef.ruleType) {
    case 'binary-correct-incorrect':
      return evaluateBinary(ruleDef.params, input);
    case 'multiple-answer-negative-marking':
      return evaluateMultipleAnswer(ruleDef.params, input);
    case 'per-blank':
      return evaluatePerBlank(ruleDef.params, input);
    case 'per-word':
      return evaluatePerWord(ruleDef.params, input);
    case 'adjacent-pair':
      return evaluateAdjacentPair(ruleDef.params, input);
    default:
      throw new Error(`Unsupported rule type: ${ruleDef.ruleType}`);
  }
}

function evaluateBinary(params: ScoringRuleParams, input: ScoringInput): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const validIds = input.context?.validAnswerIdentifiers as string[] | undefined;
  const correctCredit = (params.correctCredit as number) ?? 1;
  const incorrectDeduction = (params.incorrectDeduction as number) ?? 0;
  const duplicatePolicy = (params.duplicatePolicy as string) ?? 'reject';

  const seen = new Set<string>();
  let score = 0;

  for (const key of selected) {
    if (duplicatePolicy === 'reject' && seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (validIds && !validIds.includes(key) && !correct.includes(key)) {
      throw new Error(`Unknown answer identifier: ${key}`);
    }
    if (correct.includes(key)) {
      score += correctCredit;
    } else {
      score -= incorrectDeduction;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'binary-correct-incorrect',
      description: `Binary scoring: ${score} from ${seen.size} unique selections`,
      contribution: score,
      metadata: {
        selectedCount: seen.size,
        correctCount: correct.length,
        correctCredit,
        incorrectDeduction,
      },
    },
  };
}

function evaluateMultipleAnswer(params: ScoringRuleParams, input: ScoringInput): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const validIds = input.context?.validAnswerIdentifiers as string[] | undefined;
  const correctCredit = (params.correctCredit as number) ?? 1;
  const incorrectDeduction = (params.incorrectDeduction as number) ?? 0;
  const duplicatePolicy = (params.duplicatePolicy as string) ?? 'reject';

  const correctSet = new Set(correct);
  const seen = new Set<string>();
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  for (const key of selected) {
    if (duplicatePolicy === 'reject' && seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (validIds && !validIds.includes(key) && !correctSet.has(key)) {
      throw new Error(`Unknown answer identifier: ${key}`);
    }
    if (correctSet.has(key)) {
      score += correctCredit;
      correctCount++;
    } else {
      score -= incorrectDeduction;
      incorrectCount++;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'multiple-answer-negative-marking',
      description: `Multiple-answer: +${correctCount * correctCredit} -${incorrectCount * incorrectDeduction}`,
      contribution: score,
      metadata: {
        correctSelections: correctCount,
        incorrectSelections: incorrectCount,
        correctCredit,
        incorrectDeduction,
      },
    },
  };
}

function evaluatePerBlank(params: ScoringRuleParams, input: ScoringInput): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const blankCredit = (params.blankCredit as number) ?? 1;
  const casePolicy = (params.casePolicy as string) ?? 'insensitive';
  const whitespacePolicy = (params.whitespacePolicy as string) ?? 'collapse';

  let score = 0;
  const blankResults: boolean[] = [];

  for (let i = 0; i < correct.length; i++) {
    const expected = normaliseBlankAnswer(correct[i] ?? '', casePolicy, whitespacePolicy);
    const given = i < selected.length ? normaliseBlankAnswer(selected[i] ?? '', casePolicy, whitespacePolicy) : '';
    const matches = expected === given;
    if (matches) {
      score += blankCredit;
    }
    blankResults.push(matches);
  }

  return {
    score,
    evidence: {
      ruleType: 'per-blank',
      description: `Per-blank: ${blankResults.filter(Boolean).length}/${correct.length} correct`,
      contribution: score,
      metadata: { blankResults, blankCredit },
    },
  };
}

function evaluatePerWord(params: ScoringRuleParams, input: ScoringInput): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const wordCredit = (params.wordCredit as number) ?? 1;
  const casePolicy = (params.casePolicy as string) ?? 'insensitive';
  const punctuationPolicy = (params.punctuationPolicy as string) ?? 'strip';

  const normalisedCorrect = correct.map((w) => normaliseWord(w, casePolicy, punctuationPolicy));
  const normalisedSelected = selected.map((w) => normaliseWord(w, casePolicy, punctuationPolicy));

  let score = 0;
  const wordResults: boolean[] = [];

  for (const word of normalisedCorrect) {
    const matches = normalisedSelected.includes(word);
    if (matches) {
      score += wordCredit;
    }
    wordResults.push(matches);
  }

  return {
    score,
    evidence: {
      ruleType: 'per-word',
      description: `Per-word: ${wordResults.filter(Boolean).length}/${normalisedCorrect.length} correct`,
      contribution: score,
      metadata: { wordResults, wordCredit },
    },
  };
}

function evaluateAdjacentPair(params: ScoringRuleParams, input: ScoringInput): RuleEvaluation {
  const selected = validateStringArray(input.selectedAnswers, 'selectedAnswers');
  const correct = validateStringArray(input.correctAnswers, 'correctAnswers');
  const correctCredit = (params.correctCredit as number) ?? 1;

  let score = 0;

  for (let i = 0; i < selected.length - 1; i++) {
    const currentItem = selected[i];
    const nextItem = selected[i + 1];
    if (currentItem === undefined || nextItem === undefined) continue;
    const currentIdx = correct.indexOf(currentItem);
    const nextIdx = correct.indexOf(nextItem);
    if (currentIdx !== -1 && nextIdx !== -1 && nextIdx === currentIdx + 1) {
      score += correctCredit;
    }
  }

  return {
    score,
    evidence: {
      ruleType: 'adjacent-pair',
      description: `Adjacent pairs: ${score / correctCredit} correct pairs`,
      contribution: score,
      metadata: { pairCount: selected.length - 1, correctCredit },
    },
  };
}

function createNoResponseResult(input: ScoringInput, profile: ScoringProfile, attemptId: string): ScoringResult {
  const noResponseRule = profile.rules.find((r) => r.ruleType === 'no-response');
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
        description: noResponseRule ? `No-response rule: ${result}` : `No response submitted: ${result}`,
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
  return value as string[];
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
