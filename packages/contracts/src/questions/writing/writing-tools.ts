import type { ScoringProfileId } from '../../question-engine/identifiers.js';

/**
 * Writing tools and learning aids configuration.
 */
export interface WritingToolsProfile {
  id: ScoringProfileId;
  version: number;
  /** Minimum word count before coaching appears. */
  minWordCoachingThreshold: number;
  /** Maximum word count before coaching appears. */
  maxWordCoachingThreshold: number;
  /** Completion classification thresholds. */
  completionClassification: CompletionClassification;
  /** Text normalisation policy. */
  normalisationPolicy: NormalisationPolicy;
  /** Available learning tools. */
  learningTools: LearningTools;
  /** Mock mode restrictions. */
  mockRestrictions: MockRestrictions;
}

export interface CompletionClassification {
  emptyThreshold: number;
  incompleteThreshold: number;
}

export interface NormalisationPolicy {
  trimWhitespace: boolean;
  normaliseUnicode: boolean;
  collapseMultipleSpaces: boolean;
}

export interface LearningTools {
  wordCount: boolean;
  spellCheck: boolean;
  grammarCheck: boolean;
  synonyms: boolean;
  templates: boolean;
}

export interface MockRestrictions {
  disableSpellCheck: boolean;
  disableGrammarCheck: boolean;
  disableSynonyms: boolean;
  disableTemplates: boolean;
  disableCoaching: boolean;
}
