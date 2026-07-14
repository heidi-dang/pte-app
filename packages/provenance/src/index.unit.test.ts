import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProvenanceChain,
  appendToChain,
  chainLength,
  lastEventInChain,
  eventsByActor,
  chainHasEventType,
} from './chain.js';
import { createContentVersionHistory, addVersion, currentVersion, versionCount } from './version-history.js';
import { matchesFilter, filterEvents } from './filter.js';
import type { AuditEventContract } from '@pte-app/contracts';

function makeAuditEventContract(overrides: Partial<AuditEventContract> = {}): AuditEventContract {
  return {
    id: 'ae-1' as any,
    version: '1.0.0' as any,
    eventType: 'created',
    actorId: 'u-1' as any,
    targetType: 'question',
    targetId: 'q-1',
    changes: {},
    timestamp: '2026-01-01T00:00:00Z' as any,
    ipAddress: null,
    userAgent: null,
    metadata: {},
    ...overrides,
  };
}

describe('provenance', () => {
  describe('chain', () => {
    it('creates empty chain', () => {
      const chain = createProvenanceChain('q-1', 'question');
      assert.equal(chain.targetId, 'q-1');
      assert.equal(chainLength(chain), 0);
    });

    it('appends events', () => {
      const chain = createProvenanceChain('q-1', 'question');
      const event = makeAuditEventContract();
      const updated = appendToChain(chain, event);
      assert.equal(chainLength(updated), 1);
    });

    it('returns last event', () => {
      const chain = createProvenanceChain('q-1', 'question');
      const event = makeAuditEventContract({ eventType: 'created' });
      const updated = appendToChain(chain, event);
      const last = lastEventInChain(updated);
      assert.equal(last?.eventType, 'created');
    });

    it('returns null for empty chain', () => {
      const chain = createProvenanceChain('q-1', 'question');
      assert.equal(lastEventInChain(chain), null);
    });

    it('filters by actor', () => {
      const chain = createProvenanceChain('q-1', 'question');
      const e1 = makeAuditEventContract({ actorId: 'u-1' as any, eventType: 'created' });
      const e2 = makeAuditEventContract({ id: 'ae-2' as any, actorId: 'u-2' as any, eventType: 'updated' });
      let updated = appendToChain(chain, e1);
      updated = appendToChain(updated, e2);
      assert.equal(eventsByActor(updated, 'u-1' as any).length, 1);
    });

    it('detects event type', () => {
      const chain = createProvenanceChain('q-1', 'question');
      const event = makeAuditEventContract({ eventType: 'published' });
      const updated = appendToChain(chain, event);
      assert.equal(chainHasEventType(updated, 'published'), true);
      assert.equal(chainHasEventType(updated, 'deleted'), false);
    });
  });

  describe('version-history', () => {
    it('creates empty history', () => {
      const history = createContentVersionHistory('q-1', 'question');
      assert.equal(history.contentId, 'q-1');
      assert.equal(versionCount(history), 0);
    });

    it('adds versions', () => {
      let history = createContentVersionHistory('q-1', 'question');
      history = addVersion(history, {
        version: '1.0.0' as any,
        auditEventId: 'ae-1',
        publishedAt: '2026-01-01T00:00:00Z',
        retiredAt: null,
      });
      assert.equal(versionCount(history), 1);
      assert.equal(currentVersion(history)?.version, '1.0.0');
    });
  });

  describe('filter', () => {
    const event = makeAuditEventContract({
      eventType: 'published',
      actorId: 'u-1' as any,
      targetType: 'question',
      timestamp: '2026-06-15T12:00:00Z' as any,
    });

    it('matches event type', () => {
      assert.equal(matchesFilter(event, { eventType: 'published' }), true);
      assert.equal(matchesFilter(event, { eventType: 'deleted' }), false);
    });

    it('matches actor', () => {
      assert.equal(matchesFilter(event, { actorId: 'u-1' as any }), true);
      assert.equal(matchesFilter(event, { actorId: 'u-2' as any }), false);
    });

    it('filters event list', () => {
      const events = [event];
      assert.equal(filterEvents(events, { eventType: 'published' }).length, 1);
      assert.equal(filterEvents(events, { eventType: 'deleted' }).length, 0);
    });
  });
});
