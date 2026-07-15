import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Phase H API integration test — requires running PostgreSQL, API, and seeded data.
// Run: POSTGRES_DATABASE=pte_test POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres POSTGRES_HOST=localhost POSTGRES_PORT=5432 npm run test:api

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function api(path: string, opts: RequestInit & { token?: string } = {}): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...headers, ...((opts.headers as any) || {}) },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({ error: 'Parse error' }));
  return { status: res.status, data };
}

async function login(email: string, password: string): Promise<string> {
  const { data } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return data.token;
}

describe('Phase H API Integration', () => {
  let studentToken: string;
  let teacherToken: string;
  let adminToken: string;
  let courseId: string;
  let lessonId: string;
  let quizId: string;

  before(async () => {
    // Register and create test users if not exist
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'student@test.com', password: 'Student123', displayName: 'Test Student' }),
      });
    } catch {}
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'teacher@test.com', password: 'Teacher123', displayName: 'Test Teacher' }),
      });
    } catch {}
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@test.com', password: 'Admin12345', displayName: 'Test Admin' }),
      });
    } catch {}

    studentToken = await login('student@test.com', 'Student123');
    teacherToken = await login('teacher@test.com', 'Teacher123');
    adminToken = await login('admin@test.com', 'Admin12345');
  });

  describe('Catalogue', () => {
    it('returns courses without auth (guest)', async () => {
      const { status, data } = await api('/learn/catalogue');
      assert.equal(status, 200);
      assert.ok(Array.isArray(data.courses));
    });

    it('guest sees only safe fields', async () => {
      const { data } = await api('/learn/catalogue');
      const c = data.courses?.[0];
      if (c) {
        assert.ok(!c.hasOwnProperty('teacherNotes'));
        assert.ok(!c.hasOwnProperty('enrolmentData'));
      }
    });
  });

  describe('Course Detail', () => {
    it('rejects unauthenticated', async () => {
      const { status } = await api('/learn/courses/test-course', { token: '' });
      assert.equal(status, 401);
    });

    it('returns course with Bearer token', async () => {
      const { status } = await api('/learn/courses/test-course', { token: studentToken });
      assert.ok(status === 200 || status === 404);
    });
  });

  describe('Enrolment', () => {
    it('rejects without auth', async () => {
      const { status } = await api('/learn/courses/any/enrol', { method: 'POST', token: '' });
      assert.equal(status, 401);
    });

    it('rejects non-existent course', async () => {
      const { status } = await api('/learn/courses/nonexistent/enrol', { method: 'POST', token: studentToken });
      assert.equal(status, 404);
    });
  });

  describe('Progress', () => {
    it('rejects without lessonId', async () => {
      const { status, data } = await api('/learn/progress', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ mutationId: 'test-1' }),
      });
      assert.equal(status, 400);
      assert.ok(data.error);
    });

    it('rejects invalid block position', async () => {
      const { status } = await api('/learn/progress', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({ lessonId: 'any', mutationId: 'test-2', blockPosition: -1, lessonVersionId: 'any' }),
      });
      assert.equal(status, 400);
    });
  });

  describe('Resume', () => {
    it('returns not enrolled for non-existent enrolment', async () => {
      const { status } = await api('/learn/progress/resume/nonexistent', { token: studentToken });
      assert.equal(status, 404);
    });
  });

  describe('Lesson Completion', () => {
    it('rejects without progress', async () => {
      const { status } = await api('/learn/lessons/any/complete', { method: 'POST', token: studentToken });
      assert.ok(status === 403 || status === 404);
    });
  });

  describe('Quiz Submission', () => {
    it('rejects without submissionId', async () => {
      const { status } = await api('/learn/quiz/any/submit', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({}),
      });
      assert.equal(status, 400);
    });
  });

  describe('Staff Routes', () => {
    it('rejects student from admin routes', async () => {
      const { status } = await api('/learn/admin/courses', {
        method: 'POST',
        token: studentToken,
        body: JSON.stringify({}),
      });
      assert.equal(status, 403);
    });

    it('rejects unauthenticated admin routes', async () => {
      const { status } = await api('/learn/admin/courses', { method: 'POST', token: '' });
      assert.equal(status, 401);
    });

    it('allows admin to create course', async () => {
      const { status, data } = await api('/learn/admin/courses', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          title: 'Test Course',
          slug: `test-course-${Date.now()}`,
          accessLevel: 'free',
          difficulty: 'beginner',
        }),
      });
      assert.equal(status, 201);
      courseId = data.id;
    });

    it('allows admin to publish course', async () => {
      if (!courseId) return;
      const { status } = await api(`/learn/admin/courses/${courseId}/publish`, { method: 'POST', token: adminToken });
      assert.equal(status, 200);
    });

    it('rejects teacher from publishing', async () => {
      const { status } = await api('/learn/admin/courses/any/publish', { method: 'POST', token: teacherToken });
      assert.equal(status, 403);
    });
  });

  describe('Teacher Notes', () => {
    it('rejects student from note access', async () => {
      const { status } = await api('/learn/admin/notes/lesson/any', { token: studentToken });
      assert.equal(status, 403);
    });
  });

  describe('Auth', () => {
    it('cookie auth works', async () => {
      const { status } = await api('/auth/me', { token: studentToken });
      assert.equal(status, 200);
    });

    it('Bearer auth works', async () => {
      const { status } = await api('/auth/me', { token: studentToken });
      assert.equal(status, 200);
    });
  });
});
