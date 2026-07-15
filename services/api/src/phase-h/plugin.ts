import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { phaseH } from '@pte-app/database';
import type { UserRole } from '../auth/rbac.js';

type AnyRepo = any;

function getAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) { reply.status(401).send({ error: 'Unauthorized' }); return null; }
  return request.auth;
}

function requireRoles(auth: { roles: readonly string[] }, allowed: UserRole[], reply: FastifyReply): boolean {
  if (!auth.roles.some((r) => allowed.includes(r as UserRole))) {
    reply.status(403).send({ error: 'Forbidden' }); return false;
  }
  return true;
}

export async function phaseHPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const { db } = options;
  const staffRoles: UserRole[] = ['admin', 'content_editor', 'teacher'];
  const repo = phaseH as unknown as Record<string, AnyRepo>;

  // ─── CATALOGUE ─────────────────────────────────────────
  app.get('/learn/catalogue', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    const query = (request.query || {}) as Record<string, string>;
    const result = await repo.courses.searchCourses(db, {
      searchText: query.search || '',
      accessLevel: query.access || undefined,
      pageSize: Math.min(parseInt(query.pageSize || '20', 10), 50),
      cursor: query.cursor,
    });
    return reply.status(200).send(result);
  });

  app.get('/learn/courses/:slug', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    const { slug } = request.params as { slug: string };
    const course = await repo.courses.getCourseBySlug(db, slug);
    if (!course || course.status !== 'published') return reply.status(404).send({ error: 'Course not found' });
    const modules = await repo.modules.listModulesForCourse(db, course.id);
    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, course.id);
    return reply.status(200).send({ course, modules, enrolment });
  });

  // ─── ENROLMENT ─────────────────────────────────────────
  app.post('/learn/courses/:courseId/enrol', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    const { courseId } = request.params as { courseId: string };
    const course = await repo.courses.getCourseById(db, courseId);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    const existing = await repo.enrolments.getEnrolment(db, auth.userId, course.id);
    if (existing) return reply.status(200).send(existing);
    const enrolment = await repo.enrolments.createEnrolment(db, {
      userId: auth.userId, courseId: course.id, courseVersionId: '',
    });
    return reply.status(201).send(enrolment);
  });

  // ─── LESSONS ───────────────────────────────────────────
  app.get('/learn/lessons/:lessonId', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    const { lessonId } = request.params as { lessonId: string };
    const lesson = await repo.lessons.getLessonById(db, lessonId);
    if (!lesson || lesson.status !== 'published') return reply.status(404).send({ error: 'Lesson not found' });
    const blocks = await repo.lessonBlocks.getLessonBlocks(db, lesson.id, '');
    const progress = await repo.progress.getProgress(db, auth.userId, lesson.id);
    return reply.status(200).send({ lesson, blocks, progress });
  });

  // ─── PROGRESS ──────────────────────────────────────────
  app.post('/learn/progress', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    const body = request.body as Record<string, unknown>;
    if (!body.lessonId || !body.mutationId) return reply.status(400).send({ error: 'lessonId and mutationId required' });
    const existing = await repo.progress.getProgress(db, auth.userId, body.lessonId);
    if (existing && existing.mutationId === body.mutationId) return reply.status(200).send(existing);
    const progress = await repo.progress.upsertProgress(db, {
      userId: auth.userId, enrolmentId: body.enrolmentId,
      courseId: body.courseId, moduleId: body.moduleId,
      lessonId: body.lessonId, lessonVersionId: body.lessonVersionId,
      lastBlockId: body.blockId, blockPosition: (body.blockPosition as number) || 0,
      progressPercentage: (body.progressPercentage as number) || 0,
      status: 'in_progress', mutationId: body.mutationId as string,
      startedAt: new Date().toISOString(), lastActivityAt: new Date().toISOString(),
    });
    return reply.status(200).send(progress);
  });

  app.get('/learn/progress/:lessonId', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    const { lessonId } = request.params as { lessonId: string };
    const progress = await repo.progress.getProgress(db, auth.userId, lessonId);
    return reply.status(200).send(progress || { status: 'not_started' });
  });

  // ─── STAFF: Courses ────────────────────────────────────
  app.post('/learn/admin/courses', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    if (!requireRoles(auth, staffRoles, reply)) return;
    const body = request.body as Record<string, unknown>;
    const course = await repo.courses.createCourse(db, {
      slug: body.slug as string, title: body.title as string,
      summary: (body.summary as string) || '', description: (body.description as string) || '',
      accessLevel: body.accessLevel || 'free', difficulty: (body.difficulty as string) || 'beginner',
      estimatedDurationMinutes: (body.estimatedDurationMinutes as number) || 0,
      skillTags: (body.skillTags as string[]) || [], thumbnailMediaId: (body.thumbnailMediaId as string) || null,
      createdBy: auth.userId,
    });
    return reply.status(201).send(course);
  });

  // ─── STAFF: Modules ────────────────────────────────────
  app.post('/learn/admin/courses/:courseId/modules', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    if (!requireRoles(auth, staffRoles, reply)) return;
    const { courseId } = request.params as { courseId: string };
    const body = request.body as Record<string, unknown>;
    const mod = await repo.modules.createCourseModule(db, {
      courseId, title: body.title as string,
      description: (body.description as string) || '',
      orderPosition: (body.orderPosition as number) || 0, createdBy: auth.userId,
    });
    return reply.status(201).send(mod);
  });

  // ─── STAFF: Lessons ────────────────────────────────────
  app.post('/learn/admin/modules/:moduleId/lessons', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    if (!requireRoles(auth, staffRoles, reply)) return;
    const { moduleId } = request.params as { moduleId: string };
    const body = request.body as Record<string, unknown>;
    const mod = await repo.modules.getCourseModuleById(db, moduleId);
    if (!mod) return reply.status(404).send({ error: 'Module not found' });
    const lesson = await repo.lessons.createLesson(db, {
      moduleId: mod.id, courseId: mod.courseId, title: body.title as string,
      slug: body.slug as string, summary: (body.summary as string) || '',
      orderPosition: (body.orderPosition as number) || 0,
      isOptional: (body.isOptional as boolean) || false,
      estimatedMinutes: (body.estimatedMinutes as number) || 10, createdBy: auth.userId,
      quizId: null,
    });
    return reply.status(201).send(lesson);
  });

  // ─── QUIZ ──────────────────────────────────────────────
  app.post('/learn/quiz/:quizId/submit', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    const { quizId } = request.params as { quizId: string };
    const body = request.body as Record<string, unknown>;
    if (!body.submissionId || !body.answers) return reply.status(400).send({ error: 'submissionId and answers required' });
    const subId = body.submissionId as string;
    const existing = await repo.quizzes.getQuizAttempts(db, quizId, auth.userId);
    const dup = (existing || []).find((a: any) => a.submissionId === subId);
    if (dup) return reply.status(200).send(dup);
    const items = await repo.quizzes.getQuizItems(db, quizId);
    const answers = body.answers as number[][];
    let score = 0;
    const fb: string[] = [];
    for (let i = 0; i < (items || []).length; i++) {
      const item = items[i];
      const correct = (item.correctAnswers || []) as number[];
      const user = answers[i] || [];
      if (correct.length === user.length && correct.every((a: number) => user.includes(a))) {
        score++; fb.push(`Question ${i + 1}: Correct`);
      } else {
        fb.push(`Question ${i + 1}: Incorrect. ${item.explanation || ''}`);
      }
    }
    const quiz = await repo.quizzes.getQuizForLesson(db, quizId, quizId);
    const passThreshold = quiz?.passThreshold ?? 0.6;
    const passed = items.length > 0 ? (score / items.length) >= passThreshold : false;
    const attempt = await repo.quizzes.createQuizAttempt(db, {
      quizId, userId: auth.userId, score, totalItems: items.length, passed,
      answers, submissionId: subId,
    });
    return reply.status(200).send({
      attempt, passed, feedback: fb,
      estimatedTrainingScore: `Estimated training score: ${score}/${items.length} (${Math.round(score / Math.max(items.length, 1) * 100)}%)`,
    });
  });

  // ─── TEACHER NOTES ─────────────────────────────────────
  app.get('/learn/admin/notes/:entityType/:entityId', async (request, reply) => {
    const auth = getAuth(request, reply); if (!auth) return;
    if (!requireRoles(auth, staffRoles, reply)) return;
    const { entityType, entityId } = request.params as { entityType: string; entityId: string };
    const notes = await repo.teacherNotes.getTeacherNotes(db, entityType as any, entityId);
    return reply.status(200).send(notes);
  });
}
