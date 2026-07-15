/**
 * Speech evidence — pronunciation, fluency, content coverage.
 */
export interface SpeechEvidenceResult {
  transcript: string;
  segments: TranscriptionSegment[];
  pronunciationEvidence: PronunciationEvidence;
  oralFluencyEvidence: OralFluencyEvidence;
  contentCoverage: ContentCoverage;
  constrainedAlignment?: ConstrainedAlignment;
  confidence: number;
  warnings: string[];
}

export interface TranscriptionSegment {
  text: string;
  startTimeMs: number;
  endTimeMs: number;
  confidence: number;
}

export interface PronunciationEvidence {
  overallScore: number;
  wordScores: WordPronunciationScore[];
}

export interface WordPronunciationScore {
  word: string;
  score: number;
  startTimeMs: number;
  endTimeMs: number;
}

export interface OralFluencyEvidence {
  speakingRate: number;
  pauseCount: number;
  pauseDurationMs: number;
  fillerWordCount: number;
  overallFluencyScore: number;
}

export interface ContentCoverage {
  coveredKeywords: string[];
  missedKeywords: string[];
  coverageRatio: number;
}

export interface ConstrainedAlignment {
  expectedText: string;
  alignmentScore: number;
  wordAccuracy: number;
}
