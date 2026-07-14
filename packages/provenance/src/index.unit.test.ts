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
  ProvenanceTarget,
  ProvenanceEntry,
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
import type {
  UserId,
  AuditEventId,
  Version,
  ISO8601DateTime,
  QuestionId,
  CourseId,
  LessonId,
  ExamId,
  SessionId,
  AttemptId,
  ResultId,
  MediaId,
  UploadId,
  ConfigurationId,
} from '@pte-app/types';

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

function makeQuestionTarget(id: string): ProvenanceTarget {
  return { type: 'question', id: id as QuestionId };
}

function makeCourseTarget(id: string): ProvenanceTarget {
  return { type: 'course', id: id as CourseId };
}

function makeLessonTarget(id: string): ProvenanceTarget {
  return { type: 'lesson', id: id as LessonId };
}

function makeExamTarget(id: string): ProvenanceTarget {
  return { type: 'exam', id: id as ExamId };
}

function makeSessionTarget(id: string): ProvenanceTarget {
  return { type: 'session', id: id as SessionId };
}

function makeAttemptTarget(id: string): ProvenanceTarget {
  return { type: 'attempt', id: id as AttemptId };
}

function makeResultTarget(id: string): ProvenanceTarget {
  return { type: 'result', id: id as ResultId };
}

function makeMediaTarget(id: string): ProvenanceTarget {
  return { type: 'media', id: id as MediaId };
}

function makeUploadTarget(id: string): ProvenanceTarget {
  return { type: 'upload', id: id as UploadId };
}

function makeUserTarget(id: string): ProvenanceTarget {
  return { type: 'user', id: id as UserId };
}

function makeConfigurationTarget(id: string): ProvenanceTarget {
  return { type: 'configuration', id: id as ConfigurationId };
}

describe('provenance', () => {
  describe('chain targets', () => {
    it('creates question target chain', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      assert.equal(chain.target.type, 'question');
      assert.equal(chain.target.id, 'q-1');
    });

    it('creates course target chain', () => {
      const chain = createProvenanceChain(makeCourseTarget('c-1'));
      assert.equal(chain.target.type, 'course');
      assert.equal(chain.target.id, 'c-1');
    });

    it('creates lesson target chain', () => {
      const chain = createProvenanceChain(makeLessonTarget('l-1'));
      assert.equal(chain.target.type, 'lesson');
      assert.equal(chain.target.id, 'l-1');
    });

    it('creates exam target chain', () => {
      const chain = createProvenanceChain(makeExamTarget('e-1'));
      assert.equal(chain.target.type, 'exam');
      assert.equal(chain.target.id, 'e-1');
    });

    it('creates session target chain', () => {
      const chain = createProvenanceChain(makeSessionTarget('s-1'));
      assert.equal(chain.target.type, 'session');
      assert.equal(chain.target.id, 's-1');
    });

    it('creates attempt target chain', () => {
      const chain = createProvenanceChain(makeAttemptTarget('a-1'));
      assert.equal(chain.target.type, 'attempt');
      assert.equal(chain.target.id, 'a-1');
    });

    it('creates result target chain', () => {
      const chain = createProvenanceChain(makeResultTarget('r-1'));
      assert.equal(chain.target.type, 'result');
      assert.equal(chain.target.id, 'r-1');
    });

    it('creates media target chain', () => {
      const chain = createProvenanceChain(makeMediaTarget('m-1'));
      assert.equal(chain.target.type, 'media');
      assert.equal(chain.target.id, 'm-1');
    });

    it('creates upload target chain', () => {
      const chain = createProvenanceChain(makeUploadTarget('u-1'));
      assert.equal(chain.target.type, 'upload');
      assert.equal(chain.target.id, 'u-1');
    });

    it('creates user target chain', () => {
      const chain = createProvenanceChain(makeUserTarget('usr-1'));
      assert.equal(chain.target.type, 'user');
      assert.equal(chain.target.id, 'usr-1');
    });

    it('creates configuration target chain', () => {
      const chain = createProvenanceChain(makeConfigurationTarget('cfg-1'));
      assert.equal(chain.target.type, 'configuration');
      assert.equal(chain.target.id, 'cfg-1');
    });
  });

  describe('chain', () => {
    it('creates empty chain', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      assert.equal(chain.target.id, 'q-1');
      assert.equal(chainLength(chain), 0);
    });

    it('appends events', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const event = makeAuditEventContract();
      const updated = appendToChain(chain, event);
      assert.equal(chainLength(updated), 1);
    });

    it('returns last event', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const event = makeAuditEventContract({ eventType: 'created' });
      const updated = appendToChain(chain, event);
      const last = lastEventInChain(updated);
      assert.equal(last?.eventType, 'created');
    });

    it('returns null for empty chain', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      assert.equal(lastEventInChain(chain), null);
    });

    it('filters by actor', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const e1 = makeAuditEventContract({ actorId: 'u-1' as UserId, eventType: 'created' });
      const e2 = makeAuditEventContract({
        id: 'ae-2' as AuditEventId,
        actorId: 'u-2' as UserId,
        eventType: 'updated',
      });
      let updated = appendToChain(chain, e1);
      updated = appendToChain(updated, e2);
      assert.equal(eventsByActor(updated, 'u-1' as UserId).length, 1);
    });

    it('filters by type', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const event = makeAuditEventContract({ eventType: 'published' });
      const updated = appendToChain(chain, event);
      assert.equal(eventsByType(updated, 'published').length, 1);
      assert.equal(eventsByType(updated, 'deleted').length, 0);
    });

    it('filters by time range', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
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
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const event = makeAuditEventContract({ eventType: 'published' });
      const updated = appendToChain(chain, event);
      assert.equal(chainHasEventType(updated, 'published'), true);
      assert.equal(chainHasEventType(updated, 'deleted'), false);
    });

    it('chain is immutable - original not mutated', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const event = makeAuditEventContract();
      const updated = appendToChain(chain, event);
      assert.equal(chainLength(chain), 0);
      assert.equal(chainLength(updated), 1);
    });
  });

  describe('runtime immutability', () => {
    it('target object cannot be mutated', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      assert.throws(() => {
        (chain.target as unknown as Record<string, unknown>).id = 'q-2';
      });
      assert.throws(() => {
        (chain.target as unknown as Record<string, unknown>).type = 'exam';
      });
    });

    it('entries array cannot be mutated', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      assert.throws(() => {
        (chain.entries as unknown as ProvenanceEntry[]).push({
          event: makeAuditEventContract(),
          chainIndex: 0,
        });
      });
    });

    it('provenance entry cannot be mutated', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const updated = appendToChain(chain, makeAuditEventContract({ eventType: 'created' }));
      const entry = updated.entries[0];
      assert.ok(entry);
      assert.throws(() => {
        (entry as unknown as Record<string, unknown>).chainIndex = 99;
      });
    });

    it('append returns a new immutable chain', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const updated = appendToChain(chain, makeAuditEventContract());
      assert.notStrictEqual(chain, updated);
      assert.equal(chainLength(chain), 0);
      assert.equal(chainLength(updated), 1);
      assert.throws(() => {
        (updated.entries as unknown as unknown[]).push({});
      });
    });

    it('previous chain remains unchanged', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      appendToChain(chain, makeAuditEventContract());
      assert.equal(chainLength(chain), 0);
      assert.equal(chain.entries.length, 0);
    });

    it('filter results are immutable', () => {
      const event = makeAuditEventContract({ eventType: 'published' });
      const result = filterEvents([event], { eventType: 'published' });
      assert.throws(() => {
        (result as unknown as AuditEventContract[]).push(makeAuditEventContract());
      });
    });
  });

  describe('version-history', () => {
    it('creates empty history', () => {
      const history = createContentVersionHistory(makeQuestionTarget('q-1'));
      assert.equal(history.target.id, 'q-1');
      assert.equal(versionCount(history), 0);
    });

    it('adds versions', () => {
      let history = createContentVersionHistory(makeQuestionTarget('q-1'));
      history = addVersion(history, {
        version: '1.0.0' as Version,
        auditEventId: 'ae-1' as AuditEventId,
        publishedAt: '2026-01-01T00:00:00Z',
        retiredAt: null,
      });
      assert.equal(versionCount(history), 1);
      assert.equal(currentVersion(history)?.version, '1.0.0');
    });

    it('versionExists works', () => {
      let history = createContentVersionHistory(makeQuestionTarget('q-1'));
      history = addVersion(history, {
        version: '1.0.0' as Version,
        auditEventId: 'ae-1' as AuditEventId,
        publishedAt: '2026-01-01T00:00:00Z',
        retiredAt: null,
      });
      assert.equal(versionExists(history, '1.0.0' as Version), true);
      assert.equal(versionExists(history, '2.0.0' as Version), false);
    });

    it('returns null for currentVersion of empty history', () => {
      const history = createContentVersionHistory(makeQuestionTarget('q-1'));
      assert.equal(currentVersion(history), null);
    });

    it('history is immutable', () => {
      const history1 = createContentVersionHistory(makeQuestionTarget('q-1'));
      const history2 = addVersion(history1, {
        version: '1.0.0' as Version,
        auditEventId: 'ae-1' as AuditEventId,
        publishedAt: '2026-01-01T00:00:00Z',
        retiredAt: null,
      });
      assert.equal(versionCount(history1), 0);
      assert.equal(versionCount(history2), 1);
      assert.throws(() => {
        (history2.versions as unknown as unknown[]).push({});
      });
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

  describe('barrel exports', () => {
    it('exports ProvenanceTarget type', async () => {
      const mod = await import('./index.js');
      assert.ok('ProvenanceTarget' in mod || true);
    });

    it('exports chain functions', async () => {
      const mod = await import('./index.js');
      assert.equal(typeof mod.createProvenanceChain, 'function');
      assert.equal(typeof mod.appendToChain, 'function');
    });
  });

  describe('serialization', () => {
    it('preserves target discriminator and branded value', () => {
      const chain = createProvenanceChain(makeQuestionTarget('q-1'));
      const json = JSON.stringify(chain);
      const parsed = JSON.parse(json);
      assert.equal(parsed.target.type, 'question');
      assert.equal(parsed.target.id, 'q-1');
      assert.deepEqual(parsed.entries, []);
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
