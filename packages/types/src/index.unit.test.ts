import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  UserId,
  QuestionId,
  ExamId,
  ISO8601DateTime,
  Version,
  JsonObject,
  JsonValue,
  ReadonlyDeep,
} from './index.js';

describe('packages/types', () => {
  describe('branded types', () => {
    it('UserId is a string brand', () => {
      const id = 'user-1' as UserId;
      assert.equal(typeof id, 'string');
      assert.equal(id, 'user-1');
    });

    it('QuestionId is a string brand', () => {
      const id = 'q-1' as QuestionId;
      assert.equal(typeof id, 'string');
    });

    it('ExamId is a string brand', () => {
      const id = 'exam-1' as ExamId;
      assert.equal(typeof id, 'string');
    });

    it('ISO8601DateTime is a string brand', () => {
      const dt = '2026-01-15T10:30:00Z' as ISO8601DateTime;
      assert.equal(typeof dt, 'string');
    });

    it('Version is a string brand', () => {
      const v = '1.0.0' as Version;
      assert.equal(typeof v, 'string');
    });
  });

  describe('JsonObject', () => {
    it('accepts a valid JSON object', () => {
      const obj: JsonObject = { key: 'value', num: 42, bool: true, arr: [1, 2] };
      assert.deepEqual(obj, { key: 'value', num: 42, bool: true, arr: [1, 2] });
    });

    it('accepts nested structures', () => {
      const obj: JsonObject = { nested: { deep: [1, 'two', null] } };
      assert.ok(obj.nested);
    });
  });

  describe('ReadonlyDeep', () => {
    it('produces deeply readonly types', () => {
      type Inner = { x: number };
      type Deep = ReadonlyDeep<{ a: Inner[] }>;
      const val: Deep = { a: [{ x: 1 }] };
      assert.equal(val.a[0]?.x, 1);
    });
  });
});
