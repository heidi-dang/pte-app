import type { ScoringProfileId } from '../question-engine/identifiers.js';

export type DuplicationAction =
  | 'reject' // duplicate selections invalidate the scoring input
  | 'deduplicate' // duplicates are removed; one copy counts
  | 'allow'; // all selection elements count

export type CasePolicy = 'insensitive' | 'sensitive';
export type PunctuationPolicy = 'strip' | 'preserve';
export type WhitespacePolicy = 'collapse' | 'preserve';

/**
 * Discriminated scoring rule definition.
 * `ruleType` is the authoritative discriminator; TS and Zod both
 * guarantee that the parameters match the declared rule type.
 */
export type ScoringRuleDefinition =
  | {
      ruleType: 'binary-correct-incorrect';
      correctCredit: number;
      incorrectDeduction: number;
      duplicateAction: DuplicationAction;
    }
  | {
      ruleType: 'multiple-answer-negative-marking';
      correctCredit: number;
      incorrectDeduction: number;
      duplicateAction: DuplicationAction;
    }
  | {
      ruleType: 'per-blank';
      blankCredit: number;
      casePolicy: CasePolicy;
      whitespacePolicy: WhitespacePolicy;
    }
  | {
      ruleType: 'per-word';
      wordCredit: number;
      casePolicy: CasePolicy;
      punctuationPolicy: PunctuationPolicy;
    }
  | {
      ruleType: 'adjacent-pair';
      correctCredit: number;
    };

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
