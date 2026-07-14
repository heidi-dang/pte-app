import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProvenanceChain,
  appendToChain,
  chainLength,
  lastEventInChain,
  eventsByActor,
  eventsByType,
  eventsInRange,
  chainHasEventType,
} from './chain.js';
import {
  createContentVersionHistory,
  addVersion,
  currentVersion,
  versionCount,
  versionExists,
} from './version-history.js';
import { matchesFilter, filterEvents } from './filter.js';
import type { AuditEventContract } from '@pte-app/contracts';
import type { UserId, AuditEventId, Version, ISO8601DateTime } from '@pte-app/types';

function makeAuditEventContract(overrides: Partial<AuditEventContract> = {}): AuditEventContract {
  return {
    id: 'ae-1' as AuditEventId,
    version: '1.0.0' as Version,
    eventType: 'created',
    actorId: 'u-1' as UserId,
    targetType: 'question',
    targetId: 'q-1',
    changes: {},
    timestamp: '2026-01-01T00:00:00Z' as ISO8601DateTime,
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
      const e1 = makeAuditEventContract({ actorId: 'u-1' as UserId, eventType: 'created' });
      const e2 = makeAuditEventContract({ id: 'ae-2' as AuditEventId, actorId: 'u-2' as UserId, eventType: 'updated' });
      let updated = appendToChain(chain, e1);
      updated = appendToChain(updated, e2);
      assert.equal(eventsByActor(updated, 'u-1' as UserId).length, 1);
    });

    it('filters by type', () => {
      const chain = createProvenanceChain('q-1', 'question');
      const event = makeAuditEventContract({ eventType: 'published' });
      const updated = appendToChain(chain, event);
      assert.equal(eventsByType(updated, 'published').length, 1);
      assert.equal(eventsByType(updated, 'deleted').length, 0);
    });

    it('filters by time range', () => {
      const chain = createProvenanceChain('q-1', 'question');
      const e1 = makeAuditEventContract({ timestamp: '2026-01-01T00:00:00Z' as ISO8601DateTime });
      const e2 = makeAuditEventContract({
        id: 'ae-2' as AuditEventId,
        timestamp: '2026-06-01T00:00:00Z' as ISO8601DateTime,
      });
      let updated = appendToChain(chain, e1);
      updated = appendToChain(updated, e2);
      const inRange = eventsInRange(
        updated,
        '2026-03-01T00:00:00Z' as ISO8601DateTime,
        '2026-12-31T23:59:59Z' as ISO8601DateTime,
      );
      assert.equal(inRange.length, 1);
    });

    it('detects event type', () => {
      const chain = createProvenanceChain('q-1', 'question');
      const event = makeAuditEventContract({ eventType: 'published' });
      const updated = appendToChain(chain, event);
      assert.equal(chainHasEventType(updated, 'published'), true);
      assert.equal(chainHasEventType(updated, 'deleted'), false);
    });

    it('chain is immutable - original not mutated', () => {
      const chain = createProvenanceChain('q-1', 'question');
      const event = makeAuditEventContract();
      const updated = appendToChain(chain, event);
      assert.equal(chainLength(chain), 0);
      assert.equal(chainLength(updated), 1);
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
        version: '1.0.0' as Version,
        auditEventId: 'ae-1',
        publishedAt: '2026-01-01T00:00:00Z',
        retiredAt: null,
      });
      assert.equal(versionCount(history), 1);
      assert.equal(currentVersion(history)?.version, '1.0.0');
    });

    it('versionExists works', () => {
      let history = createContentVersionHistory('q-1', 'question');
      history = addVersion(history, {
        version: '1.0.0' as Version,
        auditEventId: 'ae-1',
        publishedAt: '2026-01-01T00:00:00Z',
        retiredAt: null,
      });
      assert.equal(versionExists(history, '1.0.0' as Version), true);
      assert.equal(versionExists(history, '2.0.0' as Version), false);
    });

    it('returns null for currentVersion of empty history', () => {
      const history = createContentVersionHistory('q-1', 'question');
      assert.equal(currentVersion(history), null);
    });

    it('history is immutable', () => {
      const history1 = createContentVersionHistory('q-1', 'question');
      const history2 = addVersion(history1, {
        version: '1.0.0' as Version,
        auditEventId: 'ae-1',
        publishedAt: '2026-01-01T00:00:00Z',
        retiredAt: null,
      });
      assert.equal(versionCount(history1), 0);
      assert.equal(versionCount(history2), 1);
    });
  });

  describe('filter', () => {
    const event = makeAuditEventContract({
      eventType: 'published',
      actorId: 'u-1' as UserId,
      targetType: 'question',
      timestamp: '2026-06-15T12:00:00Z' as ISO8601DateTime,
    });

    it('matches event type', () => {
      assert.equal(matchesFilter(event, { eventType: 'published' }), true);
      assert.equal(matchesFilter(event, { eventType: 'deleted' }), false);
    });

    it('matches actor', () => {
      assert.equal(matchesFilter(event, { actorId: 'u-1' as UserId }), true);
      assert.equal(matchesFilter(event, { actorId: 'u-2' as UserId }), false);
    });

    it('matches target type', () => {
      assert.equal(matchesFilter(event, { targetType: 'question' }), true);
      assert.equal(matchesFilter(event, { targetType: 'exam' }), false);
    });

    it('matches time range', () => {
      assert.equal(matchesFilter(event, { from: '2026-01-01T00:00:00Z' }), true);
      assert.equal(matchesFilter(event, { from: '2026-12-01T00:00:00Z' }), false);
      assert.equal(matchesFilter(event, { to: '2026-12-01T00:00:00Z' }), true);
      assert.equal(matchesFilter(event, { to: '2026-01-01T00:00:00Z' }), false);
    });

    it('filters event list', () => {
      const events = [event];
      assert.equal(filterEvents(events, { eventType: 'published' }).length, 1);
      assert.equal(filterEvents(events, { eventType: 'deleted' }).length, 0);
    });

    it('matches with empty filter (all match)', () => {
      assert.equal(matchesFilter(event, {}), true);
    });
  });

  describe('no infrastructure imports', () => {
    it('chain.ts has no HTTP or database imports', async () => {
      const fs = await import('node:fs');
      const chainContent = fs.readFileSync(new URL('./chain.ts', import.meta.url), 'utf-8');
      assert.ok(!chainContent.includes("from 'http"));
      assert.ok(!chainContent.includes("from 'pg"));
      assert.ok(!chainContent.includes("from 'mysql"));
      assert.ok(!chainContent.includes("from 'node:http"));
    });

    it('filter.ts has no HTTP or database imports', async () => {
      const fs = await import('node:fs');
      const filterContent = fs.readFileSync(new URL('./filter.ts', import.meta.url), 'utf-8');
      assert.ok(!filterContent.includes("from 'http"));
      assert.ok(!filterContent.includes("from 'pg"));
    });

    it('version-history.ts has no HTTP or database imports', async () => {
      const fs = await import('node:fs');
      const vhContent = fs.readFileSync(new URL('./version-history.ts', import.meta.url), 'utf-8');
      assert.ok(!vhContent.includes("from 'http"));
      assert.ok(!vhContent.includes("from 'pg"));
    });
  });
});
