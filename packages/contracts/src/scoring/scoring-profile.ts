import type { ScoringProfileId } from '../question-engine/identifiers.js';

export type DuplicationAction =
  | 'reject' // duplicates are silently ignored
  | 'deduplicate' // duplicates are removed; one copy counts
  | 'allow'; // all selection elements count

export type CasePolicy = 'insensitive' | 'sensitive';
export type PunctuationPolicy = 'strip' | 'preserve';
export type WhitespacePolicy = 'collapse' | 'preserve';

export type ScoringRuleType =
  'binary-correct-incorrect' | 'multiple-answer-negative-marking' | 'per-blank' | 'per-word' | 'adjacent-pair';

/**
 * Discriminated per-rule parameter set.  Each rule type has its own
 * required fields; no generic optional bag.
 */
export type ScoringRuleParams =
  | { kind: 'binary'; correctCredit: number; incorrectDeduction: number; duplicateAction: DuplicationAction }
  | { kind: 'multiple-answer'; correctCredit: number; incorrectDeduction: number; duplicateAction: DuplicationAction }
  | { kind: 'per-blank'; blankCredit: number; casePolicy: CasePolicy; whitespacePolicy: WhitespacePolicy }
  | { kind: 'per-word'; wordCredit: number; casePolicy: CasePolicy; punctuationPolicy: PunctuationPolicy }
  | { kind: 'adjacent-pair'; correctCredit: number };

export interface ScoringRuleDefinition {
  ruleType: ScoringRuleType;
  params: ScoringRuleParams;
}

/**
 * Versioned scoring profile — controls all objective scoring behaviour.
 * Every scoring operation is driven by explicit rule definitions.
 */
export interface ScoringProfile {
  id: ScoringProfileId;
  version: number;
  rules: ScoringRuleDefinition[];
  normalisation: NormalisationConfig;
  noResponseBehaviour: NoResponseBehaviour;
  minimumResult: number;
  maximumResult: number;
  rounding: RoundingPolicy;
}

export interface RoundingPolicy {
  method: 'none' | 'floor' | 'ceil' | 'round';
  decimalPlaces: number;
}

export interface NormalisationConfig {
  enabled: boolean;
  method: 'none' | 'linear' | 'z-score';
  referenceMean?: number;
  referenceStdDev?: number;
}

export interface NoResponseBehaviour {
  result: number;
  reason: 'profile-default' | 'penalty' | 'zero';
}
