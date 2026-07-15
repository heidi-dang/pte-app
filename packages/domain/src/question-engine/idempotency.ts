import { createHash } from 'node:crypto';
import type { IdempotencyKey, QuestionSessionId } from '@pte-app/contracts';

export interface IdempotencyRecord {
  id: string;
  sessionId: QuestionSessionId;
  idempotencyKey: IdempotencyKey;
  requestFingerprint: string;
  resultPayload: string;
  createdAt: string;
}

export function validateIdempotencyKey(key: string): boolean {
  // Simple UUID-like structure validation
  if (!key) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
}

export function createRequestFingerprint(payload: unknown): string {
  const jsonStr = JSON.stringify(payload) || '';
  return createHash('sha256').update(jsonStr).digest('hex');
}

export function detectIdempotencyConflict(
  existing: IdempotencyRecord,
  incomingFingerprint: string
): 'match' | 'conflict' {
  return existing.requestFingerprint === incomingFingerprint ? 'match' : 'conflict';
}
