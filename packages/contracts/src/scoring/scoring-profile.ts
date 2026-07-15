import type { ScoringProfileId } from '../question-engine/identifiers.js';

/**
 * Versioned scoring profile — controls all objective scoring behaviour.
 * Every scoring operation is driven by explicit rule definitions.
 */
export interface ScoringProfile {
  id: ScoringProfileId;
  version: number;
  /** Explicit rule definitions for this profile. */
  rules: ScoringRuleDefinition[];
  /** Normalisation policy applied after rule evaluation. */
  normalisation: NormalisationConfig;
  /** No-response behaviour. */
  noResponseBehaviour: NoResponseBehaviour;
  /** Minimum bound applied after normalisation. */
  minimumResult: number;
  /** Maximum bound applied after normalisation. */
  maximumResult: number;
  /** Rounding policy applied last. */
  rounding: RoundingPolicy;
}

export type ScoringRuleType =
  | 'binary-correct-incorrect'
  | 'multiple-answer-negative-marking'
  | 'per-blank'
  | 'per-word'
  | 'adjacent-pair'
  | 'no-response';

export interface ScoringRuleDefinition {
  ruleType: ScoringRuleType;
  /** Per-rule configured values. */
  params: ScoringRuleParams;
}

export interface ScoringRuleParams {
  correctCredit?: number;
  incorrectDeduction?: number;
  blankCredit?: number;
  wordCredit?: number;
  casePolicy?: 'insensitive' | 'sensitive';
  punctuationPolicy?: 'strip' | 'preserve';
  whitespacePolicy?: 'collapse' | 'preserve';
  duplicatePolicy?: 'reject' | 'allow';
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
