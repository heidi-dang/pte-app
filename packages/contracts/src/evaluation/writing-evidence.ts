/**
 * Writing evaluation evidence — content, form, grammar, vocabulary.
 */
export interface WritingEvaluationResult {
  contentCoverage: ContentCoverage;
  formEvidence: FormEvidence;
  grammarEvidence: GrammarEvidence;
  vocabularyEvidence: VocabularyEvidence;
  writtenDiscourseEvidence: WrittenDiscourseEvidence;
  spellingEvidence?: SpellingEvidence;
  confidence: number;
  warnings: string[];
}

export interface ContentCoverage {
  coveredKeywords: string[];
  missedKeywords: string[];
  coverageRatio: number;
}

export interface FormEvidence {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  meetsWordRequirement: boolean;
}

export interface GrammarEvidence {
  overallScore: number;
  errorCount: number;
  errors: GrammarError[];
}

export interface GrammarError {
  offset: number;
  length: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface VocabularyEvidence {
  overallScore: number;
  uniqueWordCount: number;
  academicWordCount: number;
  lexicalDiversity: number;
}

export interface WrittenDiscourseEvidence {
  overallScore: number;
  coherenceScore: number;
  cohesionScore: number;
  paragraphStructureScore: number;
}

export interface SpellingEvidence {
  overallScore: number;
  errorCount: number;
  errors: SpellingError[];
}

export interface SpellingError {
  offset: number;
  length: number;
  original: string;
  suggestions: string[];
}
