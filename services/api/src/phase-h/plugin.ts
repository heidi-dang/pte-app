import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { phaseH } from '@pte-app/database';
import type { UserRole } from '../auth/rbac.js';
import { hasPermission } from '../auth/rbac.js';
import { requirePublicationEligibility } from '../content-provenance/publication-guard.js';
import { getEntitlementDecision, cancelEntitlement } from './entitlements.js';
import crypto from 'node:crypto';
import type { ContentId, ContentVersionId, RequestId, UserId, CourseVersionId } from '@pte-app/contracts';

type AnyRepo = Record<string, any>;
const repo = phaseH as unknown as AnyRepo;

// ─── Permission evaluators (staff, not student entitlements) ──

function canPublish(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'content:publish');
}
function canEdit(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'content:edit');
}
function canRetire(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'content:retire');
}
function isAdmin(roles: readonly string[]): boolean {
  return hasPermission(roles as UserRole[], 'users:manage');
}
function isTeacher(roles: readonly string[]): boolean {
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidFromString(input: string): string {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16)}${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}

function reqId(request: FastifyRequest): RequestId {
  const header = (request.headers['x-request-id'] as string) ?? '';
  if (UUID_RE.test(header)) return header as RequestId;
  if (header) return uuidFromString(header) as RequestId;
  return crypto.randomUUID() as RequestId;
}

// ─── Staff bypass ──────────────────────────────────────────

function isStaff(auth: { roles: readonly string[] }): boolean {
  return canEdit(auth.roles) || isAdmin(auth.roles);
}

// ─── Version resolvers ─────────────────────────────────────

async function resolveCourseVersion(db: DatabaseConnection, courseId: string, status: string): Promise<string | null> {
  const r = await db.pool.query<{ id: string }>(
    `SELECT id FROM course_versions WHERE course_id = $1 AND status = $2 ORDER BY version DESC LIMIT 1`,
    [courseId, status],
  );
  return r.rows[0]?.id ?? null;
}
async function resolveLessonVersion(db: DatabaseConnection, lessonId: string, status: string): Promise<string | null> {
  const r = await db.pool.query<{ id: string }>(
    `SELECT id FROM lesson_versions WHERE lesson_id = $1 AND status = $2 ORDER BY version DESC LIMIT 1`,
    [lessonId, status],
  );
  return r.rows[0]?.id ?? null;
}
async function resolvePublishedLessonVersion(db: DatabaseConnection, lessonId: string): Promise<string | null> {
  return resolveLessonVersion(db, lessonId, 'published');
}
async function resolveDraftLessonVersion(db: DatabaseConnection, lessonId: string): Promise<string | null> {
  return resolveLessonVersion(db, lessonId, 'draft');
}
async function resolvePublishedCourseVersion(db: DatabaseConnection, courseId: string): Promise<string | null> {
  return resolveCourseVersion(db, courseId, 'published');
}
async function resolveDraftCourseVersion(db: DatabaseConnection, courseId: string): Promise<string | null> {
  return resolveCourseVersion(db, courseId, 'draft');
}

// ─── Plugin ────────────────────────────────────────────────

export async function phaseHPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const { db } = options;

  // ═══════════════════════════════════════════════════════
  // PUBLIC: Catalogue (guest-accessible per Phase A contract)
  // ═══════════════════════════════════════════════════════
  app.get('/learn/catalogue', async (request, reply) => {
    const query = (request.query || {}) as Record<string, string>;
    const result = await repo.courses.searchCourses(db, {
      searchText: query.search || '',
      accessLevel: query.access || undefined,
      pageSize: Math.min(parseInt(query.pageSize || '20', 10), 50),
      cursor: query.cursor,
    });
    const courses = (result.courses || []).map((c: any) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      difficulty: c.difficulty,
      estimatedDurationMinutes: c.estimatedDurationMinutes,
      accessLevel: c.accessLevel,
      skillTags: c.skillTags,
      status: c.status,
    }));
    return reply.status(200).send({ courses, page: result.page, total: result.total });
  });

  // ═══════════════════════════════════════════════════════
  // STUDENT: Course Detail
  // ═══════════════════════════════════════════════════════
  app.get('/learn/courses/:slug', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { slug } = request.params as { slug: string };
    const course = await repo.courses.getCourseBySlug(db, slug);
    if (!course || course.status !== 'published') return reply.status(404).send({ error: 'Course not found' });

    let decision;
    if (isStaff(auth)) {
      decision = { allowed: true, reason: 'staff_bypass', historicalReadAllowed: true, newActivityAllowed: true };
    } else {
      decision = await getEntitlementDecision(db, auth.userId, course.accessLevel || 'free', course.id);
    }
    if (!decision.newActivityAllowed) {
      return reply.status(403).send({ error: 'Forbidden', ...decision });
    }

    const modules = await repo.modules.listModulesForCourse(db, course.id);
    const lessonsByModule = await Promise.all(modules.map((m: any) => repo.lessons.listLessonsForModule(db, m.id)));
    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, course.id);

    const lessonDetails: any[] = [];
    for (let i = 0; i < modules.length; i++) {
      const moduleLessons = lessonsByModule[i] || [];
      for (const lesson of moduleLessons) {
        const prereq = await repo.prerequisites.checkPrerequisites(db, lesson.id, auth.userId);
        const progress = enrolment ? await repo.progress.getProgress(db, auth.userId, lesson.id) : undefined;
        lessonDetails.push({
          moduleId: modules[i].id,
          lesson: lesson,
          progress: progress || null,
          locked: prereq.locked,
          lockReason: prereq.reason,
        });
      }
    }

    return reply.status(200).send({ course, modules, lessons: lessonDetails, enrolment, access: decision });
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

    let decision;
    if (isStaff(auth)) {
      decision = { allowed: true, newActivityAllowed: true };
    } else {
      decision = await getEntitlementDecision(db, auth.userId, course.accessLevel || 'free', course.id);
    }
    if (!decision.allowed || (!decision.newActivityAllowed && !isStaff(auth))) {
      return reply.status(403).send({ error: 'Forbidden', reason: decision.reason });
    }

    const existing = await repo.enrolments.getEnrolment(db, auth.userId, course.id);
    if (existing) return reply.status(200).send(existing);

    const cvId = await resolvePublishedCourseVersion(db, course.id);
    if (!cvId) return reply.status(400).send({ error: 'No published course version available' });

    const enrolment = await repo.enrolments.createEnrolment(db, {
      userId: auth.userId,
      courseId: course.id,
      courseVersionId: cvId as CourseVersionId,
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

    let decision;
    if (course && (isStaff(auth) || isTeacher(auth.roles))) {
      decision = { allowed: true, newActivityAllowed: true };
    } else if (course) {
      decision = await getEntitlementDecision(db, auth.userId, course.accessLevel || 'free', course.id);
    } else {
      decision = { allowed: true, newActivityAllowed: true };
    }
    if (!decision.newActivityAllowed) {
      return reply.status(403).send({ error: 'Forbidden', ...decision });
    }

    const prereq = await repo.prerequisites.checkPrerequisites(db, lesson.id, auth.userId);
    if (prereq.locked) {
      return reply.status(403).send({
        error: 'Prerequisite not satisfied',
        reason: prereq.reason,
        prerequisiteId: prereq.blockingPrerequisiteId,
      });
    }

    const lvId = await resolvePublishedLessonVersion(db, lesson.id);
    if (!lvId) return reply.status(400).send({ error: 'No published lesson version' });

    const blocks = await repo.lessonBlocks.getLessonBlocks(db, lvId);
    const progress = await repo.progress.getProgress(db, auth.userId, lesson.id);
    const quiz = await repo.quizzes.getQuizForLesson(db, lesson.id).catch(() => null);

    let teacherNotes: any[] = [];
    if (isTeacher(auth.roles) && course) {
      const assigned = await repo.assignments.isTeacherAssignedToCourse(db, auth.userId, course.id);
      if (assigned) teacherNotes = await repo.teacherNotes.getTeacherNotes(db, 'lesson', lesson.id).catch(() => []);
    } else if (isAdmin(auth.roles) || canEdit(auth.roles)) {
      teacherNotes = await repo.teacherNotes.getTeacherNotes(db, 'lesson', lesson.id).catch(() => []);
    }

    return reply.status(200).send({
      lesson: { ...lesson, versionId: lvId },
      blocks,
      progress,
      access: decision,
      quiz: quiz ? { id: quiz.id, title: quiz.title, description: quiz.description } : null,
      teacherNotes: teacherNotes.length > 0 ? teacherNotes : undefined,
    });
  });

  // ═══════════════════════════════════════════════════════
  // STUDENT: Progress (server-authoritative)
  // ═══════════════════════════════════════════════════════
  app.post('/learn/progress', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const body = request.body as Record<string, unknown>;
    const lessonId = body.lessonId as string;
    const mutationId = body.mutationId as string;
    if (!lessonId || !mutationId) return reply.status(400).send({ error: 'lessonId and mutationId required' });

    const existing = await repo.progress.getProgress(db, auth.userId, lessonId);
    if (existing && existing.mutationId === mutationId) return reply.status(200).send(existing);

    const lesson = await repo.lessons.getLessonById(db, lessonId);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const course = lesson.courseId ? await repo.courses.getCourseById(db, lesson.courseId) : null;
    if (course && !isStaff(auth)) {
      const dec = await getEntitlementDecision(db, auth.userId, course.accessLevel || 'free', course.id);
      if (!dec.newActivityAllowed) return reply.status(403).send({ error: 'Forbidden', reason: dec.reason });
    }

    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, lesson.courseId || '');
    if (!enrolment) return reply.status(403).send({ error: 'Not enrolled' });

    const prereq = await repo.prerequisites.checkPrerequisites(db, lessonId, auth.userId);
    if (prereq.locked) {
      return reply.status(403).send({
        error: 'Prerequisite not satisfied',
        reason: prereq.reason,
        prerequisiteId: prereq.blockingPrerequisiteId,
      });
    }

    const lvId = (body.lessonVersionId as string) || (await resolvePublishedLessonVersion(db, lessonId));
    if (!lvId) return reply.status(400).send({ error: 'No published lesson version' });

    // Validate version belongs to lesson
    const lv = await db.pool.query<{ lesson_id: string; status: string }>(
      `SELECT lesson_id, status FROM lesson_versions WHERE id = $1`,
      [lvId],
    );
    if (!lv.rows[0]) return reply.status(404).send({ error: 'Lesson version not found' });
    if (lv.rows[0].lesson_id !== lessonId)
      return reply.status(400).send({ error: 'Version does not belong to lesson' });

    // Resolve module
    const module = lesson.moduleId ? await repo.modules.getCourseModuleById(db, lesson.moduleId) : null;
    const moduleId = module?.id || '';
    const courseId = lesson.courseId as string;

    // Validate block
    const blocks = await repo.lessonBlocks.getLessonBlocks(db, lvId).catch(() => []);
    const blockId = body.blockId as string;
    const blockPosition = body.blockPosition as number;

    if (typeof blockPosition !== 'number' || !Number.isInteger(blockPosition) || blockPosition < 0) {
      return reply.status(400).send({ error: 'Invalid block position' });
    }
    if (blocks.length > 0 && blockPosition >= blocks.length) {
      return reply.status(400).send({ error: 'Block position out of range' });
    }
    if (blockId && blocks.length > 0) {
      const valid = blocks.some((b: any) => b.id === blockId);
      if (!valid) return reply.status(400).send({ error: 'Block does not belong to this lesson version' });
    }

    // Reject stale revisions
    if (existing && body.revision !== undefined && (body.revision as number) < (existing.version || 0)) {
      return reply.status(409).send({ error: 'Stale update', currentRevision: existing.version });
    }

    const pct = blocks.length > 0 ? Math.round(((blockPosition + 1) / blocks.length) * 100) : 0;

    const progress = await repo.progress.upsertProgress(
      db,
      auth.userId,
      enrolment.id,
      courseId,
      moduleId,
      lessonId,
      lvId,
      { blockId, blockPosition, progressPercentage: pct, mutationId },
    );
    return reply.status(200).send(progress);
  });

  app.get('/learn/progress/resume/:courseId', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { courseId } = request.params as { courseId: string };
    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, courseId);
    if (!enrolment) return reply.status(404).send({ error: 'Not enrolled' });
    const all = await repo.progress.listProgressForEnrolment(db, enrolment.id);
    const ip = (all || []).filter((p: any) => p.status !== 'completed');
    if (ip.length > 0) {
      const latest = ip.sort((a: any, b: any) =>
        String(b.lastActivityAt || '').localeCompare(String(a.lastActivityAt || '')),
      )[0];
      return reply.status(200).send({
        resumeType: 'in_progress',
        lessonId: latest.lessonId,
        lessonVersionId: latest.lessonVersionId,
        blockPosition: latest.blockPosition,
      });
    }
    return reply.status(200).send({ resumeType: 'first_lesson', courseId });
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
    if (course && !isStaff(auth)) {
      const dec = await getEntitlementDecision(db, auth.userId, course.accessLevel || 'free', course.id);
      if (!dec.newActivityAllowed) return reply.status(403).send({ error: 'Forbidden', reason: dec.reason });
    }

    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, lesson.courseId || '');
    if (!enrolment) return reply.status(403).send({ error: 'Not enrolled' });

    const prereq = await repo.prerequisites.checkPrerequisites(db, lessonId, auth.userId);
    if (prereq.locked) {
      return reply.status(403).send({
        error: 'Prerequisite not satisfied',
        reason: prereq.reason,
        prerequisiteId: prereq.blockingPrerequisiteId,
      });
    }

    const lvId = await resolvePublishedLessonVersion(db, lessonId);
    if (!lvId) return reply.status(400).send({ error: 'No published lesson version' });

    const blocks = await repo.lessonBlocks.getLessonBlocks(db, lvId).catch(() => []);
    const progress = await repo.progress.getProgress(db, auth.userId, lessonId);
    if (!progress || progress.status === 'not_started') return reply.status(400).send({ error: 'No lesson progress' });
    if (blocks.length > 0 && (progress.blockPosition ?? 0) < blocks.length - 1)
      return reply.status(400).send({ error: 'Not all blocks completed' });

    const quiz = await repo.quizzes.getQuizForLesson(db, lessonId).catch(() => null);
    if (quiz?.isRequired) {
      const attempts = await repo.quizzes.getQuizAttempts(db, quiz.id, auth.userId);
      if (!attempts.some((a: any) => a.passed)) return reply.status(400).send({ error: 'Required quiz not passed' });
    }

    const result = await repo.progress.completeProgress(db, auth.userId, lessonId);
    return reply
      .status(200)
      .send({ progress: result, estimatedTrainingResult: 'Lesson completed', lessonVersionId: lvId });
  });

  // ═══════════════════════════════════════════════════════
  // STUDENT: Quiz (secured)
  // ═══════════════════════════════════════════════════════
  app.get('/learn/quiz/:quizId/items', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { quizId } = request.params as { quizId: string };
    const items = await repo.quizzes.getQuizItems(db, quizId);
    return reply.status(200).send({ items });
  });

  app.post('/learn/quiz/:quizId/submit', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { quizId } = request.params as { quizId: string };
    const body = request.body as Record<string, unknown>;
    if (!body.submissionId || !body.answers)
      return reply.status(400).send({ error: 'submissionId and answers required' });
    const subId = body.submissionId as string;

    const qr = await db.pool.query<{ id: string; lesson_id: string; pass_threshold: number }>(
      `SELECT id, lesson_id, pass_threshold FROM lesson_quizzes WHERE id = $1`,
      [quizId],
    );
    if (!qr.rows[0]) return reply.status(404).send({ error: 'Quiz not found' });

    const lesson = await repo.lessons.getLessonById(db, qr.rows[0].lesson_id);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const course = lesson.courseId ? await repo.courses.getCourseById(db, lesson.courseId) : null;
    if (course && !isStaff(auth)) {
      const dec = await getEntitlementDecision(db, auth.userId, course.accessLevel || 'free', course.id);
      if (!dec.newActivityAllowed) return reply.status(403).send({ error: 'Forbidden', reason: dec.reason });
    }

    const enrolment = await repo.enrolments.getEnrolment(db, auth.userId, lesson.courseId || '');
    if (!enrolment) return reply.status(403).send({ error: 'Not enrolled' });

    const prereq = await repo.prerequisites.checkPrerequisites(db, lesson.id, auth.userId);
    if (prereq.locked) {
      return reply.status(403).send({
        error: 'Prerequisite not satisfied',
        reason: prereq.reason,
        prerequisiteId: prereq.blockingPrerequisiteId,
      });
    }

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
    const passThreshold = qr.rows[0].pass_threshold ?? 0.6;
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
    if (!canEdit(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
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
    if (!canEdit(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { courseId } = request.params as { courseId: string };
    return reply.status(200).send(await repo.courses.updateCourse(db, courseId, request.body as any));
  });

  app.post('/learn/admin/courses/:courseId/publish', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canPublish(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { courseId } = request.params as { courseId: string };
    const course = await repo.courses.getCourseById(db, courseId);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    const vId = await resolveDraftCourseVersion(db, courseId);
    if (!vId) return reply.status(400).send({ error: 'No draft course version to publish' });
    const pub = await requirePublicationEligibility(
      db,
      auth.userId as UserId,
      course.id as ContentId,
      vId as ContentVersionId,
      reqId(request),
    );
    if (!pub.eligible)
      return reply.status(400).send({
        error: 'Publication not eligible',
        blockers: pub.blockers,
        warnings: pub.warnings,
        decisionId: pub.decisionId,
      });
    return reply
      .status(200)
      .send({ course: await repo.courses.publishCourse(db, course.id), decisionId: pub.decisionId });
  });

  app.post('/learn/admin/courses/:courseId/retire', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canRetire(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { courseId } = request.params as { courseId: string };
    const course = await repo.courses.getCourseById(db, courseId);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    return reply.status(200).send(await repo.courses.retireCourse(db, course.id));
  });

  // ═══════════════════════════════════════════════════════
  // STAFF: Modules, Lessons, Blocks, Prerequisites, Notes
  // ═══════════════════════════════════════════════════════
  app.post('/learn/admin/courses/:courseId/modules', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEdit(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { courseId } = request.params as { courseId: string };
    const body = request.body as Record<string, unknown>;
    return reply.status(201).send(
      await repo.modules.createCourseModule(db, {
        courseId,
        title: body.title as string,
        description: (body.description as string) || '',
        orderPosition: (body.orderPosition as number) || 0,
        createdBy: auth.userId,
      }),
    );
  });

  app.post('/learn/admin/modules/:moduleId/lessons', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEdit(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { moduleId } = request.params as { moduleId: string };
    const body = request.body as Record<string, unknown>;
    const mod = await repo.modules.getCourseModuleById(db, moduleId);
    if (!mod) return reply.status(404).send({ error: 'Module not found' });
    return reply.status(201).send(
      await repo.lessons.createLesson(db, {
        moduleId: mod.id,
        courseId: mod.courseId,
        title: body.title as string,
        slug: body.slug as string,
        summary: (body.summary as string) || '',
        orderPosition: (body.orderPosition as number) || 0,
        isOptional: (body.isOptional as boolean) || false,
        estimatedMinutes: (body.estimatedMinutes as number) || 10,
        createdBy: auth.userId,
      }),
    );
  });

  app.post('/learn/admin/lessons/:lessonId/publish', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canPublish(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { lessonId } = request.params as { lessonId: string };
    const lesson = await repo.lessons.getLessonById(db, lessonId);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });
    const vId = await resolveDraftLessonVersion(db, lessonId);
    if (!vId) return reply.status(400).send({ error: 'No draft lesson version to publish' });
    const pub = await requirePublicationEligibility(
      db,
      auth.userId as UserId,
      lesson.id as ContentId,
      vId as ContentVersionId,
      reqId(request),
    );
    if (!pub.eligible)
      return reply.status(400).send({
        error: 'Publication not eligible',
        blockers: pub.blockers,
        warnings: pub.warnings,
        decisionId: pub.decisionId,
      });
    return reply
      .status(200)
      .send({ lesson: await repo.lessons.publishLesson(db, lesson.id), decisionId: pub.decisionId });
  });

  app.post('/learn/admin/lessons/:lessonId/retire', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canRetire(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { lessonId } = request.params as { lessonId: string };
    return reply.status(200).send(await repo.lessons.retireLesson(db, lessonId));
  });

  app.post('/learn/admin/lessons/:lessonId/blocks', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEdit(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { lessonId } = request.params as { lessonId: string };
    const body = request.body as Record<string, unknown>;
    const lvId = (body.lessonVersionId as string) || (await resolvePublishedLessonVersion(db, lessonId)) || '';
    if (!lvId) return reply.status(400).send({ error: 'No lesson version' });
    return reply.status(201).send(
      await repo.lessonBlocks.createLessonBlock(db, {
        lessonId,
        lessonVersionId: lvId,
        blockType: body.blockType || 'text',
        orderPosition: (body.orderPosition as number) || 0,
        title: (body.title as string) || '',
        content: body.content || {},
      }),
    );
  });

  app.post('/learn/admin/prerequisites', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEdit(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const body = request.body as Record<string, unknown>;
    try {
      return reply.status(201).send(
        await repo.prerequisites.createPrerequisite(db, {
          lessonId: body.lessonId as string,
          prerequisiteType: (body.prerequisiteType as string) || 'lesson_completion',
          requiredLessonId: (body.requiredLessonId as string) || null,
          requiredModuleId: (body.requiredModuleId as string) || null,
          requiredCourseId: (body.requiredCourseId as string) || null,
          createdBy: auth.userId,
        }),
      );
    } catch (err: any) {
      if (err.message?.includes('cycle')) return reply.status(400).send({ error: 'Prerequisite cycle detected' });
      if (err.message?.includes('self')) return reply.status(400).send({ error: 'Self-dependency not allowed' });
      throw err;
    }
  });

  app.delete('/learn/admin/prerequisites/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEdit(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const { id } = request.params as { id: string };
    await repo.prerequisites.deletePrerequisite(db, id);
    return reply.status(200).send({ ok: true });
  });

  app.post('/learn/admin/notes', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEdit(auth.roles) && !isTeacher(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const body = request.body as Record<string, unknown>;
    return reply.status(201).send(
      await repo.teacherNotes.createTeacherNote(db, {
        entityType: body.entityType as string,
        entityId: body.entityId as string,
        content: body.content as string,
        authorId: auth.userId,
      }),
    );
  });

  app.get('/learn/admin/notes/:entityType/:entityId', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!canEdit(auth.roles) && !isTeacher(auth.roles) && !isAdmin(auth.roles))
      return reply.status(403).send({ error: 'Forbidden' });
    const { entityType, entityId } = request.params as { entityType: string; entityId: string };
    return reply.status(200).send(await repo.teacherNotes.getTeacherNotes(db, entityType as any, entityId));
  });

  // ═══════════════════════════════════════════════════════
  // STAFF: Entitlement lifecycle (for deterministic E2E)
  // ═══════════════════════════════════════════════════════
  app.post('/learn/admin/entitlements/cancel', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!isAdmin(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const body = request.body as Record<string, unknown>;
    const userId = body.userId as string;
    const courseId = body.courseId as string;
    if (!userId || !courseId) return reply.status(400).send({ error: 'userId and courseId required' });
    const result = await cancelEntitlementByScope(db, userId, 'course', courseId);
    return reply.status(200).send({ ok: true, entitlement: result });
  });

  app.post('/learn/admin/entitlements/expire', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!isAdmin(auth.roles)) return reply.status(403).send({ error: 'Forbidden' });
    const body = request.body as Record<string, unknown>;
    const userId = body.userId as string;
    const courseId = body.courseId as string;
    if (!userId || !courseId) return reply.status(400).send({ error: 'userId and courseId required' });
    const result = await expireEntitlementByScope(db, userId, 'course', courseId);
    return reply.status(200).send({ ok: true, entitlement: result });
  });
}

async function cancelEntitlementByScope(
  db: DatabaseConnection,
  userId: string,
  scopeType: string,
  scopeValue: string,
): Promise<import('./entitlements.js').EntitlementRecord | null> {
  return cancelEntitlement(db, userId, scopeType, scopeValue);
}

async function expireEntitlementByScope(
  db: DatabaseConnection,
  userId: string,
  scopeType: string,
  scopeValue: string,
): Promise<import('./entitlements.js').EntitlementRecord | null> {
  const r = await db.pool.query<Record<string, unknown>>(
    `UPDATE user_entitlements SET status = 'expired', expires_at = NOW()
     WHERE user_id = $1 AND scope_type = $2 AND scope_value = $3 AND status = 'active'
     RETURNING id, user_id, scope_type, scope_value, status, starts_at, expires_at, cancelled_at`,
    [userId, scopeType, scopeValue],
  );
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    scopeType: row.scope_type as string,
    scopeValue: row.scope_value as string,
    status: row.status as 'expired',
    startsAt: row.starts_at as string,
    expiresAt: row.expires_at as string | null,
    cancelledAt: row.cancelled_at as string | null,
  };
}
