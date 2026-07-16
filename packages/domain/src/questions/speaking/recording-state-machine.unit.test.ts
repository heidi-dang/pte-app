import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionRecording,
  transitionRecording,
  isTerminalRecordingState,
  isActiveRecordingState,
  isMutableRecordingState,
} from './recording-state-machine.js';
import type { RecordingState } from '@pte-app/contracts';

describe('Recording State Machine', () => {
  describe('legal transitions', () => {
    const legal: Array<[RecordingState, RecordingState]> = [
      ['not-started', 'device-check'],
      ['not-started', 'abandoned'],
      ['device-check', 'preparing'],
      ['preparing', 'opening-microphone'],
      ['opening-microphone', 'recording'],
      ['recording', 'stopping'],
      ['stopping', 'locally-preserved'],
      ['locally-preserved', 'upload-queued'],
      ['upload-queued', 'uploading'],
      ['uploading', 'uploaded'],
      ['uploading', 'upload-paused'],
      ['upload-paused', 'uploading'],
      ['upload-paused', 'upload-retrying'],
      ['upload-retrying', 'uploading'],
      ['uploaded', 'processing'],
      ['processing', 'available'],
      ['processing', 'failed'],
      ['failed', 'abandoned'],
      ['failed', 'upload-retrying'],
      ['available', undefined as unknown as RecordingState],
    ];

    for (const [from, to] of legal) {
      if (to === undefined) continue;
      it(`${from} → ${to} is valid`, () => {
        assert.equal(canTransitionRecording(from, to), true);
      });
    }
  });

  describe('abandonment from active states', () => {
    const abandonFrom: RecordingState[] = [
      'not-started',
      'device-check',
      'preparing',
      'opening-microphone',
      'recording',
      'stopping',
      'locally-preserved',
      'upload-queued',
      'uploading',
      'upload-paused',
      'upload-retrying',
      'failed',
    ];

    for (const from of abandonFrom) {
      it(`can abandon from ${from}`, () => {
        assert.equal(canTransitionRecording(from, 'abandoned'), true);
      });
    }
  });

  describe('expiry transitions', () => {
    const expiryFrom: RecordingState[] = [
      'not-started',
      'device-check',
      'preparing',
      'opening-microphone',
      'recording',
      'stopping',
      'locally-preserved',
      'upload-queued',
      'uploading',
      'upload-paused',
      'upload-retrying',
      'failed',
    ];

    for (const from of expiryFrom) {
      it(`can expire from ${from}`, () => {
        assert.equal(canTransitionRecording(from, 'expired'), true);
      });
    }
  });

  describe('illegal transitions', () => {
    it('cannot transition from available (terminal)', () => {
      assert.equal(canTransitionRecording('available', 'recording'), false);
    });

    it('cannot transition from abandoned (terminal)', () => {
      assert.equal(canTransitionRecording('abandoned', 'recording'), false);
    });

    it('cannot transition from expired (terminal)', () => {
      assert.equal(canTransitionRecording('expired', 'recording'), false);
    });

    it('throws on illegal transition', () => {
      assert.throws(() => transitionRecording('available', 'recording'), /Invalid recording transition/);
    });
  });

  describe('terminal states', () => {
    it('available is terminal', () => {
      assert.equal(isTerminalRecordingState('available'), true);
    });
    it('abandoned is terminal', () => {
      assert.equal(isTerminalRecordingState('abandoned'), true);
    });
    it('expired is terminal', () => {
      assert.equal(isTerminalRecordingState('expired'), true);
    });
    it('failed is not terminal', () => {
      assert.equal(isTerminalRecordingState('failed'), false);
    });
    it('recording is not terminal', () => {
      assert.equal(isTerminalRecordingState('recording'), false);
    });
  });

  describe('active states', () => {
    it('recording is active', () => {
      assert.equal(isActiveRecordingState('recording'), true);
    });
    it('uploading is active', () => {
      assert.equal(isActiveRecordingState('uploading'), true);
    });
    it('processing is active', () => {
      assert.equal(isActiveRecordingState('processing'), true);
    });
    it('upload-retrying is active', () => {
      assert.equal(isActiveRecordingState('upload-retrying'), true);
    });
    it('available is not active', () => {
      assert.equal(isActiveRecordingState('available'), false);
    });
  });

  describe('mutable states', () => {
    it('recording is mutable', () => {
      assert.equal(isMutableRecordingState('recording'), true);
    });
    it('available is not mutable', () => {
      assert.equal(isMutableRecordingState('available'), false);
    });
  });
});
