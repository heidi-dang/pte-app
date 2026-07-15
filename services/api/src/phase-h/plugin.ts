import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { phaseH } from '@pte-app/database';
import type { UserRole } from '../auth/rbac.js';
import { hasPermission } from '../auth/rbac.js';
import { requirePublicationEligibility } from '../content-provenance/publication-guard.js';
import type { ContentId, ContentVersionId, RequestId, UserId, CourseVersionId } from '@pte-app/contracts';

type AnyRepo = Record<string, any>;
const repo = phaseH as unknown as AnyRepo;

// ─── Phase E Access Service ───────────────────────────────

interface AccessDecision {
  allowed: boolean;
  reason: string;
}

function evaluateAccess(roles: readonly string[], courseAccessLevel: string, permission?: string): AccessDecision {
  if (courseAccessLevel === 'free') return { allowed: true, reason: 'free_course' };
  if (courseAccessLevel === 'paid' || courseAccessLevel === 'entitlement') {
    if (hasPermission(roles as UserRole[], 'content:edit')) {
      return { allowed: true, reason: 'content_role' };
    }
    if (hasPermission(roles as UserRole[], 'students:view')) {
      return { allowed: true, reason: 'teacher_role' };
    }
    if (hasPermission(roles as UserRole[], 'users:manage')) {
      return { allowed: true, reason: 'admin_role' };
    }
    return { allowed: false, reason: 'ENTITLEMENT_REQUIRED' };
  }
  if (permission && !hasPermission(roles as UserRole[], permission)) {
    return { allowed: false, reason: 'FORBIDDEN' };
  }
  return { allowed: true, reason: 'ok' };
}

function isAdmin(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'users:manage');
}

function canPublish(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'content:publish');
}

function canEditContent(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'content:edit');
}

function canRetire(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'content:retire');
}

function canViewStudents(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'students:view');
}

// ─── Auth helpers ──────────────────────────────────────────

function getAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return request.auth;
}

function reqId(request: FastifyRequest): RequestId {
  return ((request.headers['x-request-id'] as string) ?? crypto.randomUUID()) as RequestId;
}

// ─── Version resolvers ─────────────────────────────────────

async function resolveCourseVersionId(db: DatabaseConnection, courseId: string): Promise<string | null> {
  const r = await db.pool.query<{ id: string }>(
    `SELECT id FROM course_versions WHERE course_id = $1 AND status = 'draft' ORDER BY version DESC LIMIT 1`,
    [courseId],
  );
  return r.rows[0]?.id ?? null;
}

async function resolvePublishedCourseVersionId(db: DatabaseConnection, courseId: string): Promise<string | null> {
  const r = await db.pool.query<{ id: string }>(
    `SELECT id FROM course_versions WHERE course_id = $1 AND status = 'published' ORDER BY version DESC LIMIT 1`,
    [courseId],
  );
  return r.rows[0]?.id ?? null;
}

async function resolveLessonVersionId(db: DatabaseConnection, lessonId: string): Promise<string | null> {
  const r = await db.pool.query<{ id: string }>(
    `SELECT id FROM lesson_versions WHERE lesson_id = $1 AND status = 'published' ORDER BY version DESC LIMIT 1`,
    [lessonId],
  );
  return r.rows[0]?.id ?? null;
}

// ─── Plugin ────────────────────────────────────────────────

export async function phaseHPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const { db } = options;

  // ═══════════════════════════════════════════════════════
  // STUDENT: Catalogue
  // ═══════════════════════════════════════════════════════
  app.get('/learn/catalogue', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const query = (request.query || {}) as Record<string, string>;
    const result = await repo.courses.searchCourses(db, {
      searchText: query.search || '',
      accessLevel: query.access || undefined,
      pageSize: Math.min(parseInt(query.pageSize || '20', 10), 50),
      cursor: query.cursor,
    });
    const filtered = {
      ...result,
      courses: (result.courses || []).filter((c: any) => evaluateAccess(auth.roles, c.accessLevel || 'free').allowed),
    };
    return reply.status(200).send(filtered);
  });

  app.get('/learn/courses/:slug', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { slug } = request.params as { slug: string };
    const course = await repo.courses.getCourseBySlug(db, slug);
    if (!course || course.status !== 'published') return reply.status(404).send({ error: 'Course not found' });
    const access = evaluateAccess(auth.roles, course.accessLevel || 'free');
    if (!access.allowed) return reply.status(403).send({ error: 'Forbidden', reason: access.reason });
    const modules = await repo.modules.listModulesForCourse(db, course.id);
    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, course.id);
    return reply.status(200).send({ course, modules, enrolment });
  });

  // ═══════════════════════════════════════════════════════
  // STUDENT: Enrolment
  // ═══════════════════════════════════════════════════════
  app.post('/learn/courses/:courseId/enrol', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { courseId } = request.params as { courseId: string };
    const course = await repo.courses.getCourseById(db, courseId);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    const access = evaluateAccess(auth.roles, course.accessLevel || 'free');
    if (!access.allowed) return reply.status(403).send({ error: 'Forbidden', reason: access.reason });
    const existing = await repo.enrolments.getEnrolment(db, auth.userId, course.id);
    if (existing) return reply.status(200).send(existing);

    const courseVersionId = await resolvePublishedCourseVersionId(db, course.id);
    if (!courseVersionId) return reply.status(400).send({ error: 'No published course version available' });

    const enrolment = await repo.enrolments.createEnrolment(db, {
      userId: auth.userId,
      courseId: course.id,
      courseVersionId: courseVersionId as CourseVersionId,
    });
    return reply.status(201).send(enrolment);
  });

  // ═══════════════════════════════════════════════════════
  // STUDENT: Lesson Delivery
  // ═══════════════════════════════════════════════════════
  app.get('/learn/lessons/:lessonId', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { lessonId } = request.params as { lessonId: string };
    const lesson = await repo.lessons.getLessonById(db, lessonId);
    if (!lesson || lesson.status !== 'published') return reply.status(404).send({ error: 'Lesson not found' });

    const course = lesson.courseId ? await repo.courses.getCourseById(db, lesson.courseId) : null;
    if (course) {
      const access = evaluateAccess(auth.roles, course.accessLevel || 'free');
      if (!access.allowed) return reply.status(403).send({ error: 'Forbidden', reason: access.reason });
    }

    const lessonVersionId = await resolveLessonVersionId(db, lesson.id);
    if (!lessonVersionId) return reply.status(400).send({ error: 'No published lesson version' });

    const blocks = await repo.lessonBlocks.getLessonBlocks(db, lessonVersionId);
    const progress = await repo.progress.getProgress(db, auth.userId, lesson.id);
    const quiz = await repo.quizzes.getQuizForLesson(db, lesson.id).catch(() => null);
    const notes = canViewStudents(auth.roles)
      ? await repo.teacherNotes.getTeacherNotes(db, 'lesson', lesson.id).catch(() => [])
      : [];
    return reply.status(200).send({
      lesson: { ...lesson, versionId: lessonVersionId },
      blocks,
      progress,
      quiz: quiz ? { id: quiz.id, title: quiz.title, description: quiz.description } : null,
      teacherNotes: notes.length > 0 ? notes : undefined,
    });
  });

  // ═══════════════════════════════════════════════════════
  // STUDENT: Progress (server-authoritative)
  // ═══════════════════════════════════════════════════════
  app.post('/learn/progress', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const body = request.body as Record<string, unknown>;
    if (!body.lessonId || !body.mutationId)
      return reply.status(400).send({ error: 'lessonId and mutationId required' });

    const existing = await repo.progress.getProgress(db, auth.userId, body.lessonId);
    if (existing && existing.mutationId === body.mutationId) return reply.status(200).send(existing);

    const lessonVersionId =
      (body.lessonVersionId as string) || (await resolveLessonVersionId(db, body.lessonId as string)) || '';
    if (!lessonVersionId) return reply.status(400).send({ error: 'No published lesson version' });

    const lesson = await repo.lessons.getLessonById(db, body.lessonId as string);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const module = lesson.moduleId ? await repo.modules.getCourseModuleById(db, lesson.moduleId) : null;
    const courseId = lesson.courseId as string;
    const moduleId = module?.id || '';

    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, courseId);
    if (!enrolment) return reply.status(403).send({ error: 'Not enrolled', reason: 'NOT_ENROLLED' });

    if (existing && existing.revision !== undefined && body.revision !== undefined) {
      if ((body.revision as number) < existing.revision)
        return reply.status(409).send({ error: 'Stale update', currentRevision: existing.revision });
    }

    const blocks = await repo.lessonBlocks.getLessonBlocks(db, lessonVersionId).catch(() => []);
    const blockId = body.blockId as string;
    if (blockId && blocks.length > 0) {
      const blockValid = blocks.some((b: any) => b.id === blockId);
      if (!blockValid) return reply.status(400).send({ error: 'Block does not belong to this lesson version' });
    }

    const blockPosition: number = Math.min((body.blockPosition as number) || 0, Math.max(blocks.length - 1, 0));
    const progressPercentage = blocks.length > 0 ? Math.round(((blockPosition + 1) / blocks.length) * 100) : 0;

    const progress = await repo.progress.upsertProgress(
      db,
      auth.userId,
      enrolment.id,
      courseId,
      moduleId,
      body.lessonId as string,
      lessonVersionId,
      {
        blockId,
        blockPosition,
        progressPercentage,
        mutationId: body.mutationId as string,
      },
    );
    return reply.status(200).send(progress);
  });

  app.get('/learn/progress/resume/:courseId', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { courseId } = request.params as { courseId: string };
    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, courseId);
    if (!enrolment) return reply.status(404).send({ error: 'Not enrolled' });
    const allProgress = await repo.progress.listProgressForEnrolment(db, enrolment.id);
    const inProgress = (allProgress || []).filter((p: any) => p.status !== 'completed');
    if (inProgress.length > 0) {
      const latest = inProgress.sort((a: any, b: any) =>
        (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''),
      )[0];
      return reply.status(200).send({
        resumeType: 'in_progress',
        lessonId: latest.lessonId,
        lessonVersionId: latest.lessonVersionId,
        blockPosition: latest.blockPosition,
        progressPercentage: latest.progressPercentage,
      });
    }
    return reply.status(200).send({ resumeType: 'first_lesson', courseId, message: 'Start from beginning' });
  });

  app.get('/learn/progress/:lessonId', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { lessonId } = request.params as { lessonId: string };
    const progress = await repo.progress.getProgress(db, auth.userId, lessonId);
    return reply.status(200).send(progress || { status: 'not_started' });
  });

  // ═══════════════════════════════════════════════════════
  // STUDENT: Completion (server-authoritative)
  // ═══════════════════════════════════════════════════════
  app.post('/learn/lessons/:lessonId/complete', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { lessonId } = request.params as { lessonId: string };

    const lesson = await repo.lessons.getLessonById(db, lessonId);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });
    const course = lesson.courseId ? await repo.courses.getCourseById(db, lesson.courseId) : null;
    if (course) {
      const access = evaluateAccess(auth.roles, course.accessLevel || 'free');
      if (!access.allowed) return reply.status(403).send({ error: 'Forbidden', reason: access.reason });
    }

    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, lesson.courseId || '');
    if (!enrolment) return reply.status(403).send({ error: 'Not enrolled' });

    const lessonVersionId = await resolveLessonVersionId(db, lessonId);
    if (!lessonVersionId) return reply.status(400).send({ error: 'No published lesson version' });

    const blocks = await repo.lessonBlocks.getLessonBlocks(db, lessonVersionId).catch(() => []);
    const progress = await repo.progress.getProgress(db, auth.userId, lessonId);
    if (!progress || progress.status === 'not_started')
      return reply.status(400).send({ error: 'No progress for this lesson' });
    if (blocks.length > 0 && (progress.blockPosition ?? 0) < blocks.length - 1)
      return reply.status(400).send({ error: 'Not all blocks completed' });

    const quiz = await repo.quizzes.getQuizForLesson(db, lessonId).catch(() => null);
    if (quiz?.isRequired) {
      const attempts = await repo.quizzes.getQuizAttempts(db, quiz.id, auth.userId);
      if (!attempts.some((a: any) => a.passed)) return reply.status(400).send({ error: 'Required quiz not passed' });
    }

    const result = await repo.progress.completeProgress(db, auth.userId, lessonId);
    if (!result) return reply.status(404).send({ error: 'No progress found' });
    return reply.status(200).send({ progress: result, estimatedTrainingResult: 'Lesson completed' });
  });

  // ═══════════════════════════════════════════════════════
  // STUDENT: Quiz (secured)
  // ═══════════════════════════════════════════════════════
  app.post('/learn/quiz/:quizId/submit', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { quizId } = request.params as { quizId: string };
    const body = request.body as Record<string, unknown>;
    if (!body.submissionId || !body.answers)
      return reply.status(400).send({ error: 'submissionId and answers required' });

    const subId = body.submissionId as string;

    const quizRow = await db.pool.query<{ id: string; lesson_id: string; pass_threshold: number }>(
      `SELECT id, lesson_id, pass_threshold FROM lesson_quizzes WHERE id = $1`,
      [quizId],
    );
    if (!quizRow.rows[0]) return reply.status(404).send({ error: 'Quiz not found' });

    const lessonId = quizRow.rows[0].lesson_id;
    const lesson = await repo.lessons.getLessonById(db, lessonId);
    if (!lesson || lesson.status !== 'published') return reply.status(404).send({ error: 'Lesson not published' });

    const course = lesson.courseId ? await repo.courses.getCourseById(db, lesson.courseId) : null;
    if (course) {
      const access = evaluateAccess(auth.roles, course.accessLevel || 'free');
      if (!access.allowed) return reply.status(403).send({ error: 'Forbidden', reason: access.reason });
    }

    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, lesson.courseId || '');
    if (!enrolment) return reply.status(403).send({ error: 'Not enrolled' });

    const items = await repo.quizzes.getQuizItems(db, quizId);
    const answers = body.answers as number[][];
    let score = 0;
    const fb: string[] = [];
    for (let i = 0; i < (items || []).length; i++) {
      const item = items[i];
      const correct = (item.correctAnswers || []) as number[];
      const user = answers[i] || [];
      if (correct.length === user.length && correct.every((a: number) => user.includes(a))) {
        score++;
        fb.push(`Item ${i + 1}: Correct`);
      } else {
        fb.push(`Item ${i + 1}: Incorrect. ${item.explanation || ''}`);
      }
    }

    const passThreshold = quizRow.rows[0].pass_threshold ?? 0.6;
    const passed = items.length > 0 ? score / items.length >= passThreshold : false;
    const attempt = await repo.quizzes.createQuizAttempt(db, {
      quizId,
      userId: auth.userId,
      score,
      totalItems: items.length,
      passed,
      answers,
      submissionId: subId,
    });
    return reply.status(200).send({
      attempt,
      passed,
      feedback: fb,
      estimatedTrainingScore: `Estimated training score: ${score}/${items.length} (${Math.round((score / Math.max(items.length, 1)) * 100)}%)`,
    });
  });

  // ═══════════════════════════════════════════════════════
  // STAFF: Courses
  // ═══════════════════════════════════════════════════════
  app.post('/learn/admin/courses', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const body = request.body as Record<string, unknown>;
    const course = await repo.courses.createCourse(db, {
      slug: body.slug as string,
      title: body.title as string,
      summary: (body.summary as string) || '',
      description: (body.description as string) || '',
      accessLevel: body.accessLevel || 'free',
      difficulty: (body.difficulty as string) || 'beginner',
      estimatedDurationMinutes: (body.estimatedDurationMinutes as number) || 0,
      skillTags: (body.skillTags as string[]) || [],
      thumbnailMediaId: (body.thumbnailMediaId as string) || null,
      createdBy: auth.userId,
    });
    return reply.status(201).send(course);
  });

  app.patch('/learn/admin/courses/:courseId', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { courseId } = request.params as { courseId: string };
    const body = request.body as Record<string, unknown>;
    const updated = await repo.courses.updateCourse(db, courseId, body as any);
    return reply.status(200).send(updated);
  });

  app.post('/learn/admin/courses/:courseId/publish', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canPublish(auth.roles))
      return reply.status(403).send({ error: 'Forbidden', detail: 'content:publish required' });
    const { courseId } = request.params as { courseId: string };
    const course = await repo.courses.getCourseById(db, courseId);
    if (!course) return reply.status(404).send({ error: 'Course not found' });

    const versionId = await resolveCourseVersionId(db, courseId);
    if (!versionId) return reply.status(400).send({ error: 'No draft course version to publish' });

    const pubResult = await requirePublicationEligibility(
      db,
      auth.userId as UserId,
      course.id as ContentId,
      versionId as ContentVersionId,
      reqId(request),
    );
    if (!pubResult.eligible) {
      return reply
        .status(400)
        .send({
          error: 'Publication not eligible',
          blockers: pubResult.blockers,
          warnings: pubResult.warnings,
          decisionId: pubResult.decisionId,
        });
    }
    const published = await repo.courses.publishCourse(db, course.id);
    return reply.status(200).send({ course: published, decisionId: pubResult.decisionId });
  });

  app.post('/learn/admin/courses/:courseId/retire', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canRetire(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { courseId } = request.params as { courseId: string };
    const course = await repo.courses.getCourseById(db, courseId);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    const retired = await repo.courses.retireCourse(db, course.id);
    return reply.status(200).send(retired);
  });

  // ═══════════════════════════════════════════════════════
  // STAFF: Modules
  // ═══════════════════════════════════════════════════════
  app.post('/learn/admin/courses/:courseId/modules', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { courseId } = request.params as { courseId: string };
    const body = request.body as Record<string, unknown>;
    const mod = await repo.modules.createCourseModule(db, {
      courseId,
      title: body.title as string,
      description: (body.description as string) || '',
      orderPosition: (body.orderPosition as number) || 0,
      createdBy: auth.userId,
    });
    return reply.status(201).send(mod);
  });

  // ═══════════════════════════════════════════════════════
  // STAFF: Lessons
  // ═══════════════════════════════════════════════════════
  app.post('/learn/admin/modules/:moduleId/lessons', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { moduleId } = request.params as { moduleId: string };
    const body = request.body as Record<string, unknown>;
    const mod = await repo.modules.getCourseModuleById(db, moduleId);
    if (!mod) return reply.status(404).send({ error: 'Module not found' });
    const lesson = await repo.lessons.createLesson(db, {
      moduleId: mod.id,
      courseId: mod.courseId,
      title: body.title as string,
      slug: body.slug as string,
      summary: (body.summary as string) || '',
      orderPosition: (body.orderPosition as number) || 0,
      isOptional: (body.isOptional as boolean) || false,
      estimatedMinutes: (body.estimatedMinutes as number) || 10,
      createdBy: auth.userId,
    });
    return reply.status(201).send(lesson);
  });

  app.post('/learn/admin/lessons/:lessonId/publish', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canPublish(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { lessonId } = request.params as { lessonId: string };
    const lesson = await repo.lessons.getLessonById(db, lessonId);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const versionId = await resolveLessonVersionId(db, lessonId);
    if (!versionId) return reply.status(400).send({ error: 'No draft lesson version to publish' });

    const pubResult = await requirePublicationEligibility(
      db,
      auth.userId as UserId,
      lesson.id as ContentId,
      versionId as ContentVersionId,
      reqId(request),
    );
    if (!pubResult.eligible) {
      return reply
        .status(400)
        .send({
          error: 'Publication not eligible',
          blockers: pubResult.blockers,
          warnings: pubResult.warnings,
          decisionId: pubResult.decisionId,
        });
    }
    const published = await repo.lessons.publishLesson(db, lesson.id);
    return reply.status(200).send({ lesson: published, decisionId: pubResult.decisionId });
  });

  app.post('/learn/admin/lessons/:lessonId/retire', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canRetire(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { lessonId } = request.params as { lessonId: string };
    const lesson = await repo.lessons.getLessonById(db, lessonId);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });
    const retired = await repo.lessons.retireLesson(db, lesson.id);
    return reply.status(200).send(retired);
  });

  // ═══════════════════════════════════════════════════════
  // STAFF: Blocks / Prerequisites / Notes
  // ═══════════════════════════════════════════════════════
  app.post('/learn/admin/lessons/:lessonId/blocks', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { lessonId } = request.params as { lessonId: string };
    const body = request.body as Record<string, unknown>;
    const lvId = (body.lessonVersionId as string) || (await resolveLessonVersionId(db, lessonId)) || '';
    if (!lvId) return reply.status(400).send({ error: 'No lesson version' });
    const block = await repo.lessonBlocks.createLessonBlock(db, {
      lessonId,
      lessonVersionId: lvId,
      blockType: body.blockType || 'text',
      orderPosition: (body.orderPosition as number) || 0,
      title: (body.title as string) || '',
      content: body.content || {},
    });
    return reply.status(201).send(block);
  });

  app.post('/learn/admin/prerequisites', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const body = request.body as Record<string, unknown>;
    try {
      const prereq = await repo.prerequisites.createPrerequisite(db, {
        lessonId: body.lessonId as string,
        prerequisiteType: (body.prerequisiteType as string) || 'lesson_completion',
        prerequisiteLessonId: (body.prerequisiteLessonId as string) || null,
        prerequisiteModuleId: (body.prerequisiteModuleId as string) || null,
        prerequisiteCourseId: (body.prerequisiteCourseId as string) || null,
      });
      return reply.status(201).send(prereq);
    } catch (err: any) {
      if (err.message?.includes('cycle')) return reply.status(400).send({ error: 'Prerequisite cycle detected' });
      if (err.message?.includes('self')) return reply.status(400).send({ error: 'Self-dependency not allowed' });
      throw err;
    }
  });

  app.delete('/learn/admin/prerequisites/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { id } = request.params as { id: string };
    await repo.prerequisites.deletePrerequisite(db, id);
    return reply.status(200).send({ ok: true });
  });

  app.post('/learn/admin/notes', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles) && !canViewStudents(auth.roles))
      return reply.status(403).send({ error: 'Forbidden' });
    const body = request.body as Record<string, unknown>;
    const note = await repo.teacherNotes.createTeacherNote(db, {
      entityType: body.entityType as string,
      entityId: body.entityId as string,
      content: body.content as string,
      authorId: auth.userId,
    });
    return reply.status(201).send(note);
  });

  app.get('/learn/admin/notes/:entityType/:entityId', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEditContent(auth.roles) && !canViewStudents(auth.roles) && !isAdmin(auth.roles))
      return reply.status(403).send({ error: 'Forbidden' });
    const { entityType, entityId } = request.params as { entityType: string; entityId: string };
    const notes = await repo.teacherNotes.getTeacherNotes(db, entityType as any, entityId);
    return reply.status(200).send(notes);
  });
}
