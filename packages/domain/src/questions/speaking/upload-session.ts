import type { UploadSession, UploadChunk } from '@pte-app/contracts';

const acknowledgedSequences = new WeakMap<UploadSession, Set<number>>();

export function createUploadSession(recordingId: string, totalChunks: number): UploadSession {
  const now = new Date().toISOString();
  const session: UploadSession = {
    id: `us_${Date.now()}`,
    recordingId,
    totalChunks,
    acknowledgedChunks: 0,
    state: 'active',
    createdAt: now,
    updatedAt: now,
  };
  acknowledgedSequences.set(session, new Set());
  return session;
}

export function acknowledgeChunk(session: UploadSession, chunk: UploadChunk): UploadSession {
  let known = acknowledgedSequences.get(session);
  if (!known) {
    known = new Set();
    acknowledgedSequences.set(session, known);
  }
  if (known.has(chunk.sequenceNumber)) {
    return session;
  }
  known.add(chunk.sequenceNumber);
  const updated: UploadSession = {
    ...session,
    acknowledgedChunks: session.acknowledgedChunks + 1,
    updatedAt: new Date().toISOString(),
  };
  acknowledgedSequences.set(updated, known);
  return updated;
}

export function isUploadComplete(session: UploadSession): boolean {
  return session.acknowledgedChunks >= session.totalChunks && session.totalChunks > 0;
}

export function detectMissingChunks(chunks: UploadChunk[], totalChunks: number): number[] {
  const acknowledged = new Set(chunks.filter((c) => c.acknowledgedAt).map((c) => c.sequenceNumber));
  const missing: number[] = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!acknowledged.has(i)) {
      missing.push(i);
    }
  }
  return missing;
}
