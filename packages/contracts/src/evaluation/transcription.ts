/**
 * Transcription result from speech evaluation.
 */
export interface TranscriptionResult {
  transcript: string;
  segments: TranscriptionSegment[];
  confidence: number;
  warnings: string[];
}

export interface TranscriptionSegment {
  text: string;
  startTimeMs: number;
  endTimeMs: number;
  confidence: number;
}
