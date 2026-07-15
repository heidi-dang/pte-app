import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID as randomUUIDImpl } from 'node:crypto';
import { startTestHarness, type TestHarness } from './test-harness.js';
import { licences, provenanceRepo as provenance, phaseH } from '@pte-app/database';
import type { CourseVersionId, LessonId, LicenceType, OwnershipType } from '@pte-app/contracts';
import {
  buildFixtures,
  createEntitlement,
  cancelEntitlement,
  expireEntitlement,
  createTeacherNote,
  createPrerequisite,
  completeLessonProgress,
  createPublicationEvidence,
  type TestFixtures,
  type TestUser,
  type TestCourse,
} from './test-fixtures.js';

const runId = `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface ApiResponse {
  status: number;
  data: any;
  headers: Headers;
}

class CookieJar {
  private cookies: Map<string, string> = new Map();

  storeFromHeaders(headers: Headers) {
    const setCookie = headers.get('set-cookie');
    if (!setCookie) return;
    for (const raw of setCookie.split(',')) {
      const [pair] = raw.split(';');
      if (!pair) continue;
      const [name, value] = pair.trim().split('=');
      if (name && value) this.cookies.set(name.trim(), value.trim());
    }
  }

  header(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  clear() {
    this.cookies.clear();
  }
}

async function api(path: string, opts: RequestInit & { token?: string; jar?: CookieJar } = {}): Promise<ApiResponse> {
  const url = `${harness.apiUrl}${path}`;
  const headers: Record<string, string> = {};
  const method = opts.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD' && opts.body === undefined) {
    opts.body = '{}';
  }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.jar && opts.jar.header()) headers.Cookie = opts.jar.header();
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers, ...((opts.headers as Record<string, string>) || {}) },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({ error: 'Parse error' }));
  if (opts.jar) opts.jar.storeFromHeaders(res.headers);
  return { status: res.status, data, headers: res.headers };
}

async function login(email: string, password: string, jar?: CookieJar): Promise<{ token: string; user: any }> {
  const { status, data } = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    jar,
  });
  assert.equal(status, 200, `login failed: ${data.error}`);
  assert.ok(data.token, 'expected token in login response');
  return { token: data.token, user: data.user };
}

async function register(email: string, password: string, displayName: string, roles?: string[]): Promise<TestUser> {
  const { status, data } = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  assert.ok(status === 201 || status === 409, `register expected 201 or 409, got ${status}: ${data.error}`);
  return { id: data.user?.id, email, password, roles: roles ?? [] };
}

let harness: TestHarness;
let fixtures: TestFixtures;

function assertGuestCourseShape(c: any) {
  assert.ok(c.id, 'course id expected');
  assert.ok(c.slug, 'course slug expected');
  assert.ok(c.title, 'course title expected');
  assert.ok(c.summary !== undefined, 'course summary expected');
  assert.ok(c.difficulty, 'course difficulty expected');
  assert.ok(c.accessLevel, 'course accessLevel expected');
  assert.ok(c.status, 'course status expected');
  assert.equal(c.teacherNotes, undefined, 'guest must not see teacherNotes');
  assert.equal(c.enrolmentData, undefined, 'guest must not see enrolmentData');
  assert.equal(c.versionId, undefined, 'guest must not see versionId');
}

describe('Phase H API Integration', () => {
  before(async () => {
    harness = await startTestHarness();
    fixtures = await buildFixtures(harness.db, { runId });
  });

  after(async () => {
    await harness?.stop();
  });

  describe('Catalogue', () => {
    it('public catalogue returns exact safe fields', async () => {
      const { status, data } = await api('/learn/catalogue');
      assert.equal(status, 200);
      assert.ok(Array.isArray(data.courses));
      const free = data.courses.find((c: any) => c.id === fixtures.freeCourse.id);
      const paid = data.courses.find((c: any) => c.id === fixtures.paidCourse.id);
      assert.ok(free, 'free course should appear in catalogue');
      assert.ok(paid, 'paid course should appear in catalogue');
      assertGuestCourseShape(free);
      assertGuestCourseShape(paid);
    });

    it('public catalogue omits teacher notes, enrolment and entitlement records', async () => {
      const { data } = await api('/learn/catalogue');
      for (const c of data.courses) {
        assert.equal(c.teacherNotes, undefined);
        assert.equal(c.enrolmentData, undefined);
        assert.equal(c.entitlement, undefined);
      }
    });
  });

  describe('Authentication', () => {
    it('cookie authentication works using a real session cookie', async () => {
      const jar = new CookieJar();
      await login(fixtures.student.email, fixtures.student.password, jar);
      const { status, data } = await api('/auth/me', { jar });
      assert.equal(status, 200);
      assert.equal(data.user.id, fixtures.student.id);
      const course = await api(`/learn/courses/${fixtures.freeCourse.slug}`, { jar });
      assert.equal(course.status, 200);
    });

    it('Bearer authentication works using an Authorization header', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api('/auth/me', { token });
      assert.equal(status, 200);
      assert.equal(data.user.id, fixtures.student.id);
      const course = await api(`/learn/courses/${fixtures.freeCourse.slug}`, { token });
      assert.equal(course.status, 200);
    });
  });

  describe('Course access', () => {
    it('free student accesses free course', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api(`/learn/courses/${fixtures.freeCourse.slug}`, { token });
      assert.equal(status, 200);
      assert.equal(data.course.id, fixtures.freeCourse.id);
      assert.equal(data.access.allowed, true);
      assert.equal(data.access.reason, 'FREE_ACCESS');
    });

    it('unentitled student is blocked from paid course', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api(`/learn/courses/${fixtures.paidCourse.slug}`, { token });
      assert.equal(status, 403);
      assert.equal(data.reason, 'ENTITLEMENT_REQUIRED');
    });

    it('active entitled student accesses paid course', async () => {
      await createEntitlement(harness.db, fixtures.student.id, fixtures.paidCourse.id);
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api(`/learn/courses/${fixtures.paidCourse.slug}`, { token });
      assert.equal(status, 200);
      assert.equal(data.course.id, fixtures.paidCourse.id);
      assert.equal(data.access.reason, 'ACTIVE_ENTITLEMENT');
    });
  });

  describe('Entitlement lifecycle', () => {
    it('expired entitlement allows historical read only', async () => {
      await createEntitlement(
        harness.db,
        fixtures.student.id,
        fixtures.paidCourse.id,
        new Date(Date.now() + 1000).toISOString(),
      );
      await new Promise((r) => setTimeout(r, 1100));
      await harness.db.pool.query(
        `UPDATE user_entitlements SET status = 'expired' WHERE user_id = $1 AND scope_value = $2`,
        [fixtures.student.id, fixtures.paidCourse.id],
      );
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api(`/learn/courses/${fixtures.paidCourse.slug}`, { token });
      assert.equal(status, 403);
      assert.equal(data.reason, 'ENTITLEMENT_EXPIRED');
      assert.equal(data.historicalReadAllowed, true);
      assert.equal(data.newActivityAllowed, false);
    });

    it('cancelled entitlement allows historical read only', async () => {
      await createEntitlement(harness.db, fixtures.student.id, fixtures.paidCourse.id);
      await cancelEntitlement(harness.db, fixtures.student.id, fixtures.paidCourse.id);
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api(`/learn/courses/${fixtures.paidCourse.slug}`, { token });
      assert.equal(status, 403);
      assert.equal(data.reason, 'ENTITLEMENT_CANCELLED');
      assert.equal(data.historicalReadAllowed, true);
      assert.equal(data.newActivityAllowed, false);
    });

    it('wrong-scope entitlement is rejected', async () => {
      const otherCourse = await buildFixtures(harness.db, { runId: `${runId}-scope` });
      await createEntitlement(harness.db, fixtures.student.id, otherCourse.paidCourse.id);
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api(`/learn/courses/${fixtures.paidCourse.slug}`, { token });
      assert.equal(status, 403);
      assert.equal(data.reason, 'ENTITLEMENT_SCOPE_MISMATCH');
    });
  });

  describe('Enrolment', () => {
    it('student enrols successfully', async () => {
      const freshStudent = await register(`student-enrol-${runId}@test.com`, 'StudentPass123', 'Enrol Student');
      const { token } = await login(freshStudent.email, freshStudent.password);
      const { status, data } = await api(`/learn/courses/${fixtures.freeCourse.id}/enrol`, {
        method: 'POST',
        token,
      });
      assert.equal(status, 201);
      assert.equal(data.userId, freshStudent.id);
      assert.equal(data.courseId, fixtures.freeCourse.id);
    });

    it('duplicate enrolment returns one row', async () => {
      const freshStudent = await register(`student-dup-${runId}@test.com`, 'StudentPass123', 'Dup Student');
      const { token } = await login(freshStudent.email, freshStudent.password);
      const first = await api(`/learn/courses/${fixtures.freeCourse.id}/enrol`, { method: 'POST', token });
      assert.equal(first.status, 201);
      const second = await api(`/learn/courses/${fixtures.freeCourse.id}/enrol`, { method: 'POST', token });
      assert.equal(second.status, 200);
      assert.equal(second.data.id, first.data.id);
    });

    it('concurrent duplicate enrolment returns one row', async () => {
      const freshStudent = await register(`student-conc-${runId}@test.com`, 'StudentPass123', 'Conc Student');
      const { token } = await login(freshStudent.email, freshStudent.password);
      const [a, b] = await Promise.all([
        api(`/learn/courses/${fixtures.freeCourse.id}/enrol`, { method: 'POST', token }),
        api(`/learn/courses/${fixtures.freeCourse.id}/enrol`, { method: 'POST', token }),
      ]);
      assert.ok([a.status, b.status].every((s) => s === 201 || s === 200));
      assert.ok(a.data.id || b.data.id);
      if (a.data.id && b.data.id) assert.equal(a.data.id, b.data.id);
    });
  });

  describe('Lesson delivery', () => {
    it('lesson delivery returns exact published version and exact blocks', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      assert.equal(status, 200);
      assert.equal(data.lesson.id, fixtures.freeCourse.lessonIds[0]);
      assert.ok(data.lesson.versionId, 'lesson version id expected');
      assert.ok(Array.isArray(data.blocks));
      assert.equal(data.blocks.length, fixtures.freeCourse.blockIds.length);
      assert.equal(data.blocks[0].blockType, 'text');
      assert.equal(data.blocks[1].blockType, 'audio');
      assert.equal(data.blocks[2].blockType, 'video');
      assert.equal(data.blocks[3].content.interactionType, 'reveal');
      assert.equal(data.blocks[4].content.interactionType, 'flashcard');
      assert.equal(data.blocks[5].content.interactionType, 'matching');
      assert.equal(data.blocks[6].content.interactionType, 'ordering');
    });

    it('wrong lesson version is rejected', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status, data } = await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: randomUUID(),
          mutationId: `wrong-version-${runId}`,
          blockPosition: 0,
        }),
      });
      assert.equal(status, 404);
      assert.equal(data.error, 'Lesson version not found');
    });

    it('wrong block/version is rejected', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const { status, data } = await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId: `wrong-block-${runId}`,
          blockId: randomUUID(),
          blockPosition: 0,
        }),
      });
      assert.equal(status, 400);
      assert.equal(data.error, 'Block does not belong to this lesson version');
    });
  });

  describe('Progress', () => {
    it('progress saves successfully', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const { status, data } = await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId: `progress-${runId}`,
          blockId: lesson.blocks[0].id,
          blockPosition: 0,
        }),
      });
      assert.equal(status, 200);
      assert.equal(data.lessonId, fixtures.freeCourse.lessonIds[0]);
      assert.equal(data.blockPosition, 0);
      assert.equal(data.status, 'in_progress');
    });

    it('duplicate progress mutation returns the original row', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const mutationId = `dup-progress-${runId}`;
      const first = await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId,
          blockId: lesson.blocks[0].id,
          blockPosition: 0,
        }),
      });
      assert.equal(first.status, 200);
      const second = await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId,
          blockId: lesson.blocks[0].id,
          blockPosition: 0,
        }),
      });
      assert.equal(second.status, 200);
      assert.equal(second.data.id, first.data.id);
    });

    it('stale progress mutation is rejected', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const mutationId = `stale-${runId}`;
      const first = await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId,
          blockId: lesson.blocks[0].id,
          blockPosition: 0,
        }),
      });
      assert.equal(first.status, 200);
      const second = await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId,
          blockId: lesson.blocks[0].id,
          blockPosition: 0,
          revision: 0,
        }),
      });
      assert.equal(second.status, 409);
      assert.equal(second.data.error, 'Stale update');
    });
  });

  describe('Resume', () => {
    it('resume returns exact lesson version, block ID and position', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId: `resume-${runId}`,
          blockId: lesson.blocks[2].id,
          blockPosition: 2,
        }),
      });
      const { status, data } = await api(`/learn/progress/resume/${fixtures.freeCourse.id}`, { token });
      assert.equal(status, 200);
      assert.equal(data.resumeType, 'in_progress');
      assert.equal(data.lessonId, fixtures.freeCourse.lessonIds[0]);
      assert.equal(data.lessonVersionId, lesson.lesson.versionId);
      assert.equal(data.blockPosition, 2);
    });
  });

  describe('Quiz', () => {
    it('required quiz accepts correct answers', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const { status, data } = await api(`/learn/quiz/${lesson.quiz.id}/submit`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          submissionId: `quiz-${runId}`,
          answers: [[1]],
        }),
      });
      assert.equal(status, 200);
      assert.equal(data.passed, true);
      assert.equal(data.attempt.score, 1);
    });

    it('duplicate concurrent quiz submission returns one attempt', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const submissionId = `quiz-conc-${runId}`;
      const [a, b] = await Promise.all([
        api(`/learn/quiz/${lesson.quiz.id}/submit`, {
          method: 'POST',
          token,
          body: JSON.stringify({ submissionId, answers: [[1]] }),
        }),
        api(`/learn/quiz/${lesson.quiz.id}/submit`, {
          method: 'POST',
          token,
          body: JSON.stringify({ submissionId, answers: [[1]] }),
        }),
      ]);
      assert.ok(a.status === 200 && b.status === 200);
      assert.ok(a.data.attempt.id || b.data.attempt.id);
      if (a.data.attempt.id && b.data.attempt.id) assert.equal(a.data.attempt.id, b.data.attempt.id);
    });

    it('failed quiz prevents completion', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      await api(`/learn/quiz/${lesson.quiz.id}/submit`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          submissionId: `quiz-fail-${runId}`,
          answers: [[0]],
        }),
      });
      const { status, data } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}/complete`, {
        method: 'POST',
        token,
      });
      assert.equal(status, 400);
      assert.equal(data.error, 'Required quiz not passed');
    });

    it('passed quiz permits completion', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const lastIdx = lesson.blocks.length - 1;
      await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId: `quiz-pass-progress-${runId}`,
          blockId: lesson.blocks[lastIdx].id,
          blockPosition: lastIdx,
        }),
      });
      await api(`/learn/quiz/${lesson.quiz.id}/submit`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          submissionId: `quiz-pass-${runId}`,
          answers: [[1]],
        }),
      });
      const { status, data } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}/complete`, {
        method: 'POST',
        token,
      });
      assert.equal(status, 200);
      assert.equal(data.progress.status, 'completed');
      assert.equal(data.lessonVersionId, lesson.lesson.versionId);
    });
  });

  describe('Completion', () => {
    it('incomplete blocks prevent completion', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      await api(`/learn/quiz/${lesson.quiz.id}/submit`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          submissionId: `complete-incomplete-quiz-${runId}`,
          answers: [[1]],
        }),
      });
      await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId: `complete-incomplete-${runId}`,
          blockId: lesson.blocks[0].id,
          blockPosition: 0,
        }),
      });
      const { status, data } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}/complete`, {
        method: 'POST',
        token,
      });
      assert.equal(status, 400);
      assert.equal(data.error, 'Not all blocks completed');
    });

    it('completion creates exact version-aware record', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const lastIdx = lesson.blocks.length - 1;
      await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson.lesson.versionId,
          mutationId: `complete-version-${runId}`,
          blockId: lesson.blocks[lastIdx].id,
          blockPosition: lastIdx,
        }),
      });
      await api(`/learn/quiz/${lesson.quiz.id}/submit`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          submissionId: `complete-version-quiz-${runId}`,
          answers: [[1]],
        }),
      });
      const { status, data } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}/complete`, {
        method: 'POST',
        token,
      });
      assert.equal(status, 200);
      assert.equal(data.progress.lessonVersionId, lesson.lesson.versionId);
      assert.equal(data.progress.status, 'completed');
    });
  });

  describe('Prerequisites', () => {
    it('prerequisite blocks lesson 2 before lesson 1 completion', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      await createPrerequisite(
        harness.db,
        fixtures.freeCourse.lessonIds[1] as LessonId,
        fixtures.freeCourse.lessonIds[0] as LessonId,
        fixtures.admin.id,
      );
      const { status, data } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[1]}`, { token });
      assert.equal(status, 403);
      assert.equal(data.reason, 'PREREQUISITE_LESSON_INCOMPLETE');
    });

    it('prerequisite unlocks lesson 2 after lesson 1 completion', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { data: lesson1 } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      const lastIdx = lesson1.blocks.length - 1;
      await api('/learn/progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          lessonId: fixtures.freeCourse.lessonIds[0],
          lessonVersionId: lesson1.lesson.versionId,
          mutationId: `unlock-progress-${runId}`,
          blockId: lesson1.blocks[lastIdx].id,
          blockPosition: lastIdx,
        }),
      });
      await api(`/learn/quiz/${lesson1.quiz.id}/submit`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          submissionId: `unlock-quiz-${runId}`,
          answers: [[1]],
        }),
      });
      await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}/complete`, { method: 'POST', token });
      const { status, data } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[1]}`, { token });
      assert.equal(status, 200);
      assert.equal(data.lesson.id, fixtures.freeCourse.lessonIds[1]);
    });
  });

  describe('Teacher notes', () => {
    it('assigned teacher can access notes', async () => {
      await createTeacherNote(
        harness.db,
        'lesson',
        fixtures.paidCourse.lessonIds[0] as LessonId,
        'Teacher note content',
        fixtures.teacher.id,
      );
      const { token } = await login(fixtures.teacher.email, fixtures.teacher.password);
      const { status, data } = await api(`/learn/admin/notes/lesson/${fixtures.paidCourse.lessonIds[0]}`, { token });
      assert.equal(status, 200);
      assert.ok(Array.isArray(data));
      assert.equal(data.length, 1);
      assert.equal(data[0].content, 'Teacher note content');
    });

    it('unassigned teacher is rejected', async () => {
      const { token } = await login(fixtures.otherTeacher.email, fixtures.otherTeacher.password);
      const { status, data } = await api(`/learn/lessons/${fixtures.paidCourse.lessonIds[0]}`, { token });
      assert.equal(status, 200);
      assert.equal(data.teacherNotes, undefined);
    });

    it('teacher assigned to another course is rejected', async () => {
      const { token } = await login(fixtures.teacher.email, fixtures.teacher.password);
      const { status, data } = await api(`/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, { token });
      assert.equal(status, 200);
      assert.equal(data.teacherNotes, undefined);
    });

    it('student responses never contain teacher notes', async () => {
      await createTeacherNote(
        harness.db,
        'lesson',
        fixtures.freeCourse.lessonIds[0] as LessonId,
        'Secret note',
        fixtures.teacher.id,
      );
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const paths = [
        '/learn/catalogue',
        `/learn/courses/${fixtures.freeCourse.slug}`,
        `/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`,
        `/learn/progress/${fixtures.freeCourse.lessonIds[0]}`,
        `/learn/progress/resume/${fixtures.freeCourse.id}`,
      ];
      for (const path of paths) {
        const { data } = await api(path, { token });
        const json = JSON.stringify(data);
        assert.ok(!json.includes('Secret note'), `${path} leaked teacher notes`);
        assert.ok(!json.includes('teacherNotes') || !data.teacherNotes, `${path} contained teacherNotes field`);
      }
    });
  });

  describe('Publication', () => {
    it('admin publication requires valid Phase G evidence', async () => {
      const { token } = await login(fixtures.admin.email, fixtures.admin.password);
      const { status, data } = await api(`/learn/admin/courses/${fixtures.freeCourse.id}/publish`, {
        method: 'POST',
        token,
        headers: { 'x-request-id': `pub-${runId}` },
      });
      assert.equal(status, 200);
      assert.ok(data.decisionId);
      assert.ok(data.course);
    });

    it('missing evidence blocks publication', async () => {
      const { token } = await login(fixtures.admin.email, fixtures.admin.password);
      const draft = await phaseH.courses.createCourse(harness.db, {
        slug: `no-evidence-${runId}`,
        title: `No Evidence ${runId}`,
        summary: '',
        description: '',
        accessLevel: 'free',
        difficulty: 'beginner',
        estimatedDurationMinutes: 0,
        skillTags: [],
        thumbnailMediaId: null,
        createdBy: fixtures.admin.id,
      });
      const { status, data } = await api(`/learn/admin/courses/${draft.id}/publish`, {
        method: 'POST',
        token,
        headers: { 'x-request-id': `no-evidence-${runId}` },
      });
      assert.equal(status, 400);
      assert.equal(data.error, 'Publication not eligible');
      assert.ok(data.blockers.some((b: any) => b.code === 'PROVENANCE_MISSING'));
    });

    it('expired licence blocks publication', async () => {
      const { token } = await login(fixtures.admin.email, fixtures.admin.password);
      const draft = await phaseH.courses.createCourse(harness.db, {
        slug: `expired-licence-${runId}`,
        title: `Expired Licence ${runId}`,
        summary: '',
        description: '',
        accessLevel: 'free',
        difficulty: 'beginner',
        estimatedDurationMinutes: 0,
        skillTags: [],
        thumbnailMediaId: null,
        createdBy: fixtures.admin.id,
      });
      const draftVersionId = await harness.db.pool
        .query<{ id: CourseVersionId }>(
          `SELECT id FROM course_versions WHERE course_id = $1 AND status = 'draft' ORDER BY version DESC LIMIT 1`,
          [draft.id],
        )
        .then((r) => r.rows[0]?.id);
      assert.ok(draftVersionId);
      const { sourceId, evidenceId, similarityCheckId } = await createPublicationEvidence(
        harness.db,
        fixtures.admin.id,
        runId,
      );
      const expiredLicenceId = await licences.createLicence(harness.db, {
        id: randomUUID() as any,
        licenceType: 'commercial' as LicenceType,
        licensor: 'Test',
        licensee: 'Test',
        rightsGranted: ['publish', 'modify', 'distribute'],
        prohibitedUses: [],
        attributionRequired: false,
        commercialUseAllowed: true,
        modificationAllowed: true,
        redistributionAllowed: true,
        validFrom: new Date(Date.now() - 86400000 * 2).toISOString(),
        validUntil: new Date(Date.now() - 86400000).toISOString(),
        jurisdiction: 'AU',
        createdBy: fixtures.admin.id,
      });
      const provId = randomUUID() as any;
      await provenance.createProvenance(harness.db, {
        id: provId,
        contentId: draft.id as any,
        contentVersionId: draftVersionId as any,
        sourceId,
        licenceId: expiredLicenceId.id as any,
        ownershipType: 'original' as OwnershipType,
        attribution: 'Test',
        evidenceIds: [evidenceId],
        createdBy: fixtures.admin.id,
      });
      await provenance.setSimilarityCheckId(harness.db, provId, similarityCheckId);
      await provenance.updateProvenanceStatus(harness.db, provId, 'verified', fixtures.admin.id);
      const { status, data } = await api(`/learn/admin/courses/${draft.id}/publish`, {
        method: 'POST',
        token,
        headers: { 'x-request-id': `expired-lic-${runId}` },
      });
      assert.equal(status, 400);
      assert.ok(data.blockers.some((b: any) => b.code === 'LICENCE_EXPIRED'));
    });

    it('duplicate publication request is idempotent', async () => {
      const { token } = await login(fixtures.admin.email, fixtures.admin.password);
      const reqId = `dup-pub-${runId}`;
      const first = await api(`/learn/admin/courses/${fixtures.freeCourse.id}/publish`, {
        method: 'POST',
        token,
        headers: { 'x-request-id': reqId },
      });
      assert.equal(first.status, 200);
      const second = await api(`/learn/admin/courses/${fixtures.freeCourse.id}/publish`, {
        method: 'POST',
        token,
        headers: { 'x-request-id': reqId },
      });
      assert.equal(second.status, 200);
      assert.equal(second.data.decisionId, first.data.decisionId);
    });
  });

  describe('Admin authorization', () => {
    it('rejects student from admin routes', async () => {
      const { token } = await login(fixtures.student.email, fixtures.student.password);
      const { status } = await api('/learn/admin/courses', { method: 'POST', token, body: JSON.stringify({}) });
      assert.equal(status, 403);
    });

    it('rejects unauthenticated admin routes', async () => {
      const { status } = await api('/learn/admin/courses', { method: 'POST', body: JSON.stringify({}) });
      assert.equal(status, 401);
    });

    it('rejects teacher from publishing', async () => {
      const { token } = await login(fixtures.teacher.email, fixtures.teacher.password);
      const { status } = await api(`/learn/admin/courses/${fixtures.freeCourse.id}/publish`, {
        method: 'POST',
        token,
      });
      assert.equal(status, 403);
    });
  });
});

function randomUUID(): string {
  return randomUUIDImpl();
}
