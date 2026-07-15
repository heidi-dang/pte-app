/**
 * Provider-neutral evaluation provider interfaces.
 * No provider or model is named or hardcoded in domain code.
 */

import type { EvaluationRequest } from './request.js';
import type { EvaluationResult } from './result.js';
import type { TranscriptionResult } from './transcription.js';
import type { SpeechEvidenceResult } from './speech-evidence.js';
import type { WritingEvaluationResult } from './writing-evidence.js';

export interface EvaluationProvider {
  readonly providerType: 'speech-transcription' | 'speech-evidence' | 'writing-evaluation';
  readonly providerId: string;
  readonly version: string;
  evaluate(request: EvaluationRequest): Promise<EvaluationResult>;
}

export interface SpeechTranscriptionProvider extends EvaluationProvider {
  readonly providerType: 'speech-transcription';
  transcribe(request: EvaluationRequest): Promise<TranscriptionResult>;
}

export interface SpeechEvidenceProvider extends EvaluationProvider {
  readonly providerType: 'speech-evidence';
  extractEvidence(request: EvaluationRequest): Promise<SpeechEvidenceResult>;
}

export interface WritingEvaluationProvider extends EvaluationProvider {
  readonly providerType: 'writing-evaluation';
  evaluateWriting(request: EvaluationRequest): Promise<WritingEvaluationResult>;
}

export interface EvaluationProviderRegistry {
  register(provider: EvaluationProvider): void;
  getProvider(providerType: string, providerId: string): EvaluationProvider | undefined;
  listProviders(providerType: string): EvaluationProvider[];
}

export interface EvaluationUsageReporter {
  reportUsage(usage: EvaluationUsage): void;
}

export interface EvaluationUsage {
  providerId: string;
  providerVersion: string;
  units: number;
  currencyNeutral: boolean;
}
