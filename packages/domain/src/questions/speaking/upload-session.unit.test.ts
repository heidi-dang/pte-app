import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createUploadSession,
  acknowledgeChunk,
  isUploadComplete,
  detectMissingChunks,
  canFinaliseUpload,
  finaliseUpload,
  isTerminalSessionState,
} from './upload-session.js';

const TS = '2025-01-01T00:00:00.000Z';
const TS2 = '2025-01-01T01:00:00.000Z';
const TS3 = '2025-01-01T01:30:00.000Z';

describe('Upload Session', () => {
  describe('createUploadSession', () => {
    it('creates a valid session', () => {
      const state = createUploadSession({ recordingId: 'rec-1', totalChunks: 3 }, 'sess-1', TS);
      assert.equal(state.session.id, 'sess-1');
      assert.equal(state.session.recordingId, 'rec-1');
      assert.equal(state.session.totalChunks, 3);
      assert.equal(state.session.acknowledgedChunks, 0);
      assert.equal(state.session.state, 'active');
      assert.deepEqual(state.acknowledgedSequenceNumbers, []);
    });

    it('rejects totalChunks <= 0', () => {
      assert.throws(() => createUploadSession({ recordingId: 'rec-1', totalChunks: 0 }, 'sess-1', TS));
      assert.throws(() => createUploadSession({ recordingId: 'rec-1', totalChunks: -1 }, 'sess-1', TS));
    });
  });

  describe('acknowledgeChunk', () => {
    it('adds a valid chunk', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      const updated = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      assert.deepEqual(updated.acknowledgedSequenceNumbers, [0]);
      assert.equal(updated.session.acknowledgedChunks, 1);
    });

    it('is idempotent for duplicate sequence', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      const s2 = acknowledgeChunk(s1, { sequenceNumber: 0, acknowledgedAt: TS3 });
      assert.deepEqual(s2.acknowledgedSequenceNumbers, [0]);
      assert.equal(s2.session.acknowledgedChunks, 1);
    });

    it('rejects negative sequence number', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      assert.throws(() => acknowledgeChunk(state, { sequenceNumber: -1, acknowledgedAt: TS2 }), /negative/);
    });

    it('rejects sequence exceeding total', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      assert.throws(() => acknowledgeChunk(state, { sequenceNumber: 3, acknowledgedAt: TS2 }), /exceeds/);
    });

    it('rejects on completed session', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 2 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      const s2 = acknowledgeChunk(s1, { sequenceNumber: 1, acknowledgedAt: TS3 });
      const completed = finaliseUpload(s2, TS3);
      assert.throws(() => acknowledgeChunk(completed, { sequenceNumber: 2, acknowledgedAt: TS3 }), /completed/);
    });

    it('rejects on failed session', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 2 }, 's1', TS);
      const failed = { ...state, session: { ...state.session, state: 'failed' as const } };
      assert.throws(() => acknowledgeChunk(failed, { sequenceNumber: 0, acknowledgedAt: TS2 }), /failed/);
    });

    it('rejects on expired session', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 2 }, 's1', TS);
      const expired = { ...state, session: { ...state.session, state: 'expired' as const } };
      assert.throws(() => acknowledgeChunk(expired, { sequenceNumber: 0, acknowledgedAt: TS2 }), /expired/);
    });
  });

  describe('isUploadComplete', () => {
    it('returns false when chunks missing', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      assert.equal(isUploadComplete(state), false);
    });

    it('returns true when all chunks present', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 2 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      const s2 = acknowledgeChunk(s1, { sequenceNumber: 1, acknowledgedAt: TS3 });
      assert.equal(isUploadComplete(s2), true);
    });
  });

  describe('detectMissingChunks', () => {
    it('returns all indexes when empty', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      assert.deepEqual(detectMissingChunks(state), [0, 1, 2]);
    });

    it('returns only missing', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      assert.deepEqual(detectMissingChunks(s1), [1, 2]);
    });
  });

  describe('finaliseUpload', () => {
    it('finalises complete upload', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 2 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      const s2 = acknowledgeChunk(s1, { sequenceNumber: 1, acknowledgedAt: TS3 });
      const result = finaliseUpload(s2, TS3);
      assert.equal(result.session.state, 'completed');
    });

    it('is idempotent', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 2 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      const s2 = acknowledgeChunk(s1, { sequenceNumber: 1, acknowledgedAt: TS3 });
      const f1 = finaliseUpload(s2, TS3);
      const f2 = finaliseUpload(f1, TS3);
      assert.equal(f2.session.state, 'completed');
    });

    it('rejects with missing chunks', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      assert.throws(() => finaliseUpload(s1, TS2), /missing chunks/);
    });

    it('rejects failed session', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 2 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      const s2 = acknowledgeChunk(s1, { sequenceNumber: 1, acknowledgedAt: TS3 });
      const failed = { ...s2, session: { ...s2.session, state: 'failed' as const } };
      assert.throws(() => finaliseUpload(failed, TS3), /failed/);
    });
  });

  describe('canFinaliseUpload', () => {
    it('returns false for incomplete', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 3 }, 's1', TS);
      assert.equal(canFinaliseUpload(state), false);
    });

    it('returns false for completed', () => {
      const state = createUploadSession({ recordingId: 'r1', totalChunks: 2 }, 's1', TS);
      const s1 = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: TS2 });
      const s2 = acknowledgeChunk(s1, { sequenceNumber: 1, acknowledgedAt: TS3 });
      const completed = finaliseUpload(s2, TS3);
      assert.equal(canFinaliseUpload(completed), false);
    });
  });

  describe('terminal session states', () => {
    it('completed is terminal', () => assert.equal(isTerminalSessionState('completed'), true));
    it('failed is terminal', () => assert.equal(isTerminalSessionState('failed'), true));
    it('expired is terminal', () => assert.equal(isTerminalSessionState('expired'), true));
    it('active is not terminal', () => assert.equal(isTerminalSessionState('active'), false));
  });
});
