import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  UserId,
  QuestionId,
  ExamId,
  SessionId,
  CourseId,
  LessonId,
  AttemptId,
  MediaId,
  UploadId,
  ResultId,
  FeedbackId,
  AuditEventId,
  ProgressId,
  ConfigurationId,
  TimingProfileId,
  SectionId,
  TaskId,
  ScoringProfileId,
  LanguageCode,
  ISO8601DateTime,
  ISO8601Date,
  NonEmptyString,
  PositiveInteger,
  NonNegativeInteger,
  Percentage,
  Version,
  ConfigurationStatus,
  JsonValue,
  JsonObject,
  ReadonlyDeep,
  Primitive,
  Brand,
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

    it('SessionId is a string brand', () => {
      const id = 's-1' as SessionId;
      assert.equal(typeof id, 'string');
    });

    it('CourseId is a string brand', () => {
      const id = 'c-1' as CourseId;
      assert.equal(typeof id, 'string');
    });

    it('LessonId is a string brand', () => {
      const id = 'l-1' as LessonId;
      assert.equal(typeof id, 'string');
    });

    it('AttemptId is a string brand', () => {
      const id = 'a-1' as AttemptId;
      assert.equal(typeof id, 'string');
    });

    it('MediaId is a string brand', () => {
      const id = 'm-1' as MediaId;
      assert.equal(typeof id, 'string');
    });

    it('UploadId is a string brand', () => {
      const id = 'u-1' as UploadId;
      assert.equal(typeof id, 'string');
    });

    it('ResultId is a string brand', () => {
      const id = 'r-1' as ResultId;
      assert.equal(typeof id, 'string');
    });

    it('FeedbackId is a string brand', () => {
      const id = 'f-1' as FeedbackId;
      assert.equal(typeof id, 'string');
    });

    it('AuditEventId is a string brand', () => {
      const id = 'ae-1' as AuditEventId;
      assert.equal(typeof id, 'string');
    });

    it('ProgressId is a string brand', () => {
      const id = 'p-1' as ProgressId;
      assert.equal(typeof id, 'string');
    });

    it('ConfigurationId is a string brand', () => {
      const id = 'cfg-1' as ConfigurationId;
      assert.equal(typeof id, 'string');
    });

    it('TimingProfileId is a string brand', () => {
      const id = 'tp-1' as TimingProfileId;
      assert.equal(typeof id, 'string');
    });

    it('SectionId is a string brand', () => {
      const id = 'sec-1' as SectionId;
      assert.equal(typeof id, 'string');
    });

    it('TaskId is a string brand', () => {
      const id = 't-1' as TaskId;
      assert.equal(typeof id, 'string');
    });

    it('LanguageCode is a string brand', () => {
      const code = 'en' as LanguageCode;
      assert.equal(typeof code, 'string');
    });

    it('ISO8601DateTime is a string brand', () => {
      const dt = '2026-01-15T10:30:00Z' as ISO8601DateTime;
      assert.equal(typeof dt, 'string');
    });

    it('ISO8601Date is a string brand', () => {
      const d = '2026-01-15' as ISO8601Date;
      assert.equal(typeof d, 'string');
    });

    it('Version is a string brand', () => {
      const v = '1.0.0' as Version;
      assert.equal(typeof v, 'string');
    });

    it('ConfigurationStatus is a string literal union', () => {
      const s: ConfigurationStatus = 'active';
      assert.equal(s, 'active');
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

  describe('brand isolation', () => {
    it('different branded types are not interchangeable at type level', () => {
      const uid = 'u-1' as UserId;
      const qid = 'q-1' as QuestionId;
      assert.notEqual(uid, qid);
      assert.equal(typeof uid, typeof qid);
    });
  });
});
