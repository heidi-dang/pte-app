import type { ScoringProfileId } from '@pte-app/contracts';

export interface WritingProfile {
  id: ScoringProfileId;
  version: number;
  minWordCoachingThreshold: number;
  maxWordCoachingThreshold: number;
  completionClassification: {
    emptyThreshold: number;
    incompleteThreshold: number;
  };
  normalisationPolicy: {
    trimWhitespace: boolean;
    normaliseUnicode: boolean;
    collapseMultipleSpaces: boolean;
  };
  learningTools: {
    wordCount: boolean;
    spellCheck: boolean;
    grammarCheck: boolean;
    synonyms: boolean;
    templates: boolean;
  };
  mockRestrictions: {
    disableSpellCheck: boolean;
    disableGrammarCheck: boolean;
    disableSynonyms: boolean;
    disableTemplates: boolean;
    disableCoaching: boolean;
  };
  timerProfileId?: string;
  scoringProfileId?: string;
}

export function isLearningToolAvailable(
  profile: WritingProfile,
  tool: keyof WritingProfile['learningTools'],
  isMockMode: boolean,
): boolean {
  if (!profile.learningTools[tool]) return false;
  if (isMockMode) {
    const restrictionKey =
      `disable${tool.charAt(0).toUpperCase()}${tool.slice(1)}` as keyof WritingProfile['mockRestrictions'];
    if (profile.mockRestrictions[restrictionKey]) return false;
  }
  return true;
}
