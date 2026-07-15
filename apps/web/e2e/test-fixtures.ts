import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@pte-app/database';
import {
  users,
  sources,
  licences,
  evidenceRepo as evidence,
  similarityRepo as similarity,
  provenanceRepo as provenance,
  policyRepo as policies,
  phaseH,
} from '@pte-app/database';
import type {
  CourseId,
  CourseVersionId,
  CourseModuleId,
  LessonId,
  LessonVersionId,
  LessonBlockId,
  LessonQuizId,
  LessonQuizItemId,
  UserId,
  SourceId,
  SourceType,
  LicenceId,
  LicenceType,
  EvidenceId,
  EvidenceType,
  MediaId,
  SimilarityCheckId,
  ProvenanceId,
  PolicyId,
  PolicyVersion,
  ContentId,
  ContentVersionId,
  OwnershipType,
} from '@pte-app/contracts';

export interface TestUser {
  id: UserId;
  email: string;
  password: string;
  roles: string[];
}

export interface TestCourse {
  id: CourseId;
  slug: string;
  title: string;
  moduleId: CourseModuleId;
  lessonIds: LessonId[];
  blockIds: LessonBlockId[];
  quizId: LessonQuizId;
  quizItemId: LessonQuizItemId;
  publishedVersionId: CourseVersionId;
}

export interface TestFixtures {
  runId: string;
  policyId: PolicyId;
  admin: TestUser;
  teacher: TestUser;
  otherTeacher: TestUser;
  student: TestUser;
  freeCourse: TestCourse;
  paidCourse: TestCourse;
}

export async function createUser(
  db: DatabaseConnection,
  email: string,
  password: string,
  roles: string[],
): Promise<TestUser> {
  const hash = await bcrypt.hash(password, 10);
  const existing = await users.getUserByEmail(db, email);
  if (existing) {
    const existingRoles = await users.getUserRoles(db, existing.id);
    return { id: existing.id as UserId, email: existing.email, password, roles: existingRoles };
  }
  const user = await users.createUser(db, { email, passwordHash: hash });
  for (const role of roles) {
    await users.addUserRole(db, user.id, role);
  }
  return { id: user.id as UserId, email: user.email, password, roles };
}

async function createPolicy(db: DatabaseConnection, runId: string): Promise<PolicyId> {
  const id = randomUUID() as PolicyId;
  await policies.createPolicy(db, {
    id,
    version: `1.0.0-${runId}` as PolicyVersion,
    status: 'active',
    effectiveFrom: new Date(Date.now() - 86400000).toISOString(),
    effectiveUntil: null,
    similarityReviewThreshold: 0.3,
    similarityBlockThreshold: 0.5,
    expiryWarningDays: 30,
    evidenceRetentionDays: 365,
    requiredEvidenceByOwnership: { original: ['ownership_document'] },
    prohibitedRules: [],
    supportedSourceTypes: ['original'],
    supportedLicenceTypes: ['commercial'],
  });
  return id;
}

async function createPublicationEvidence(
  db: DatabaseConnection,
  actorId: UserId,
  runId: string,
): Promise<{ sourceId: SourceId; licenceId: LicenceId; evidenceId: EvidenceId; similarityCheckId: SimilarityCheckId }> {
  const sourceId = randomUUID() as SourceId;
  await sources.createSource(db, {
    id: sourceId,
    sourceType: 'original' as SourceType,
    title: `Source ${runId}`,
    owner: 'Test Owner',
    publisher: 'Test Publisher',
    sourceUrl: 'https://example.com/source',
    jurisdiction: 'AU',
    sourceDate: new Date().toISOString(),
    accessDate: new Date().toISOString(),
    description: 'Test source',
    createdBy: actorId,
  });

  const licenceId = randomUUID() as LicenceId;
  await licences.createLicence(db, {
    id: licenceId,
    licenceType: 'commercial' as LicenceType,
    licensor: 'Test Licensor',
    licensee: 'Test Licensee',
    rightsGranted: ['publish', 'modify', 'distribute'],
    prohibitedUses: [],
    attributionRequired: false,
    commercialUseAllowed: true,
    modificationAllowed: true,
    redistributionAllowed: true,
    validFrom: new Date(Date.now() - 86400000).toISOString(),
    validUntil: new Date(Date.now() + 86400000 * 365).toISOString(),
    jurisdiction: 'AU',
    createdBy: actorId,
  });

  const evidenceId = randomUUID() as EvidenceId;
  await evidence.createEvidence(db, {
    id: evidenceId,
    evidenceType: 'ownership_document' as EvidenceType,
    fileName: 'ownership.pdf',
    mediaId: 'media-123' as MediaId,
    checksum: 'a'.repeat(64),
    mimeType: 'application/pdf',
    description: 'Ownership evidence',
    uploadedBy: actorId,
    retainedUntil: new Date(Date.now() + 86400000 * 365).toISOString(),
  });

  const similarityCheckId = randomUUID() as SimilarityCheckId;
  await similarity.createSimilarityCheck(db, {
    id: similarityCheckId,
    contentId: randomUUID() as any,
    contentVersionId: randomUUID() as any,
    providerId: 'test-provider' as any,
    profileVersion: '1.0.0',
    evidenceSnapshot: 'test',
  });
  await similarity.completeSimilarityCheck(db, similarityCheckId, { similarityScore: 0.05, matchedSources: [] });

  return { sourceId, licenceId, evidenceId, similarityCheckId };
}

async function createProvenanceRecord(
  db: DatabaseConnection,
  contentId: CourseId,
  contentVersionId: CourseVersionId,
  actorId: UserId,
  runId: string,
): Promise<void> {
  const { sourceId, licenceId, evidenceId, similarityCheckId } = await createPublicationEvidence(db, actorId, runId);
  const provId = randomUUID() as ProvenanceId;
  await provenance.createProvenance(db, {
    id: provId,
    contentId: contentId as unknown as ContentId,
    contentVersionId: contentVersionId as unknown as ContentVersionId,
    sourceId,
    licenceId,
    ownershipType: 'original' as OwnershipType,
    attribution: 'Test Attribution',
    evidenceIds: [evidenceId],
    createdBy: actorId,
  });
  await provenance.setSimilarityCheckId(db, provId, similarityCheckId);
  await provenance.updateProvenanceStatus(db, provId, 'verified', actorId);
}

async function createLessonWithBlocks(
  db: DatabaseConnection,
  courseId: CourseId,
  moduleId: CourseModuleId,
  title: string,
  slug: string,
  orderPosition: number,
  createdBy: UserId,
): Promise<{
  lessonId: LessonId;
  publishedVersionId: LessonVersionId;
  blockIds: LessonBlockId[];
  quizId: LessonQuizId;
  quizItemId: LessonQuizItemId;
}> {
  const lesson = await phaseH.lessons.createLesson(db, {
    moduleId,
    courseId,
    title,
    slug,
    summary: `Summary for ${title}`,
    orderPosition,
    isOptional: false,
    estimatedMinutes: 10,
    createdBy,
  });

  const publishedVersionId = await db.pool
    .query<{ id: LessonVersionId }>(
      `SELECT id FROM lesson_versions WHERE lesson_id = $1 AND status = 'draft' ORDER BY version DESC LIMIT 1`,
      [lesson.id],
    )
    .then((r: { rows: Array<{ id: LessonVersionId }> }) => r.rows[0]?.id);

  if (!publishedVersionId) throw new Error('No draft lesson version created');

  const blocks: { type: string; content: Record<string, unknown> }[] = [
    { type: 'text', content: { text: `Welcome to ${title}` } },
    {
      type: 'audio',
      content: {
        src: 'https://example.com/audio.mp3',
        transcript: `Audio transcript for ${title}`,
        transcriptMetadata: { language: 'en', autoGenerated: false },
      },
    },
    {
      type: 'video',
      content: {
        src: 'https://example.com/video.mp4',
        captions: [{ lang: 'en', src: 'https://example.com/captions.vtt', label: 'English' }],
        captionMetadata: { provider: 'internal', hasCaptions: true },
      },
    },
    {
      type: 'interactive',
      content: {
        interactionType: 'reveal',
        prompt: 'Click to reveal',
        hidden: 'Revealed content',
      },
    },
    {
      type: 'interactive',
      content: {
        interactionType: 'flashcard',
        front: 'Front question',
        back: 'Back answer',
      },
    },
    {
      type: 'interactive',
      content: {
        interactionType: 'matching',
        pairs: [
          { left: 'A', right: '1' },
          { left: 'B', right: '2' },
        ],
      },
    },
    {
      type: 'interactive',
      content: {
        interactionType: 'ordering',
        items: ['First', 'Second', 'Third'],
        correctOrder: [0, 1, 2],
      },
    },
  ];

  const blockIds: LessonBlockId[] = [];
  for (const [i, entry] of blocks.entries()) {
    if (!entry) continue;
    const block = await phaseH.lessonBlocks.createLessonBlock(db, {
      lessonId: lesson.id,
      lessonVersionId: publishedVersionId,
      blockType: entry.type as any,
      orderPosition: i,
      title: `${entry.type} block`,
      content: entry.content,
    });
    blockIds.push(block.id);
  }

  const quiz = await phaseH.quizzes.createQuiz(db, {
    lessonId: lesson.id,
    title: `${title} quiz`,
    passThreshold: 0.5,
    isRequired: true,
  });

  const quizItem = await phaseH.quizzes.createQuizItem(db, {
    quizId: quiz.id,
    itemType: 'single_choice',
    question: 'What is 2+2?',
    options: ['3', '4', '5'],
    correctAnswers: [1],
    orderPosition: 0,
    explanation: 'Correct answer is 4',
  });

  return { lessonId: lesson.id, publishedVersionId, blockIds, quizId: quiz.id, quizItemId: quizItem.id };
}

async function createCourse(
  db: DatabaseConnection,
  title: string,
  slug: string,
  accessLevel: 'free' | 'paid' | 'entitlement',
  createdBy: UserId,
  runId: string,
): Promise<TestCourse> {
  const course = await phaseH.courses.createCourse(db, {
    slug,
    title,
    summary: `Summary for ${title}`,
    description: `Description for ${title}`,
    accessLevel,
    difficulty: 'beginner',
    estimatedDurationMinutes: 60,
    skillTags: ['listening', 'reading'],
    thumbnailMediaId: null,
    createdBy,
  });

  const module = await phaseH.modules.createCourseModule(db, {
    courseId: course.id,
    title: `${title} Module`,
    description: 'Test module',
    orderPosition: 0,
    createdBy,
  });

  const lesson1 = await createLessonWithBlocks(
    db,
    course.id,
    module.id,
    `${title} Lesson 1`,
    `${slug}-lesson-1`,
    0,
    createdBy,
  );
  const lesson2 = await createLessonWithBlocks(
    db,
    course.id,
    module.id,
    `${title} Lesson 2`,
    `${slug}-lesson-2`,
    1,
    createdBy,
  );

  const draftVersionId = await db.pool
    .query<{ id: CourseVersionId }>(
      `SELECT id FROM course_versions WHERE course_id = $1 AND status = 'draft' ORDER BY version DESC LIMIT 1`,
      [course.id],
    )
    .then((r: { rows: Array<{ id: CourseVersionId }> }) => r.rows[0]?.id);

  if (!draftVersionId) throw new Error('No draft course version created');

  await createProvenanceRecord(db, course.id, draftVersionId, createdBy, runId);
  await phaseH.courses.publishCourse(db, course.id);
  await phaseH.lessons.publishLesson(db, lesson1.lessonId);
  await phaseH.lessons.publishLesson(db, lesson2.lessonId);

  const publishedVersionId = await db.pool
    .query<{ id: CourseVersionId }>(
      `SELECT id FROM course_versions WHERE course_id = $1 AND status = 'published' ORDER BY version DESC LIMIT 1`,
      [course.id],
    )
    .then((r: { rows: Array<{ id: CourseVersionId }> }) => r.rows[0]?.id);

  if (!publishedVersionId) throw new Error('No published course version created');

  return {
    id: course.id,
    slug,
    title,
    moduleId: module.id,
    lessonIds: [lesson1.lessonId, lesson2.lessonId],
    blockIds: lesson1.blockIds,
    quizId: lesson1.quizId,
    quizItemId: lesson1.quizItemId,
    publishedVersionId,
  };
}

export async function buildFixtures(db: DatabaseConnection, options: { runId?: string } = {}): Promise<TestFixtures> {
  const runId = options.runId ?? `t${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const policyId = await createPolicy(db, runId);

  const admin = await createUser(db, `admin-${runId}@test.com`, 'AdminPass123', ['admin']);
  const teacher = await createUser(db, `teacher-${runId}@test.com`, 'TeacherPass123', ['teacher']);
  const otherTeacher = await createUser(db, `other-teacher-${runId}@test.com`, 'TeacherPass123', ['teacher']);
  const student = await createUser(db, `student-${runId}@test.com`, 'StudentPass123', ['student']);

  const freeCourse = await createCourse(db, `Free Course ${runId}`, `free-course-${runId}`, 'free', admin.id, runId);
  const paidCourse = await createCourse(db, `Paid Course ${runId}`, `paid-course-${runId}`, 'paid', admin.id, runId);

  await phaseH.assignments.createTeacherAssignment(db, { teacherId: teacher.id, courseId: paidCourse.id });

  await phaseH.enrolments.createEnrolment(db, {
    userId: student.id,
    courseId: freeCourse.id,
    courseVersionId: freeCourse.publishedVersionId,
  });

  await phaseH.teacherNotes.createTeacherNote(db, {
    entityType: 'lesson',
    entityId: paidCourse.lessonIds[0] as LessonId,
    content: 'Teacher note content',
    authorId: teacher.id,
  });

  await phaseH.teacherNotes.createTeacherNote(db, {
    entityType: 'lesson',
    entityId: freeCourse.lessonIds[0] as LessonId,
    content: 'Secret note',
    authorId: teacher.id,
  });

  return {
    runId,
    policyId,
    admin,
    teacher,
    otherTeacher,
    student,
    freeCourse,
    paidCourse,
  };
}

export async function createEntitlement(
  db: DatabaseConnection,
  userId: UserId,
  courseId: CourseId,
  expiresAt?: string,
): Promise<void> {
  await db.pool.query(
    `INSERT INTO user_entitlements (user_id, scope_type, scope_value, status, starts_at, expires_at)
     VALUES ($1, 'course', $2, 'active', NOW(), $3)
     ON CONFLICT (user_id, scope_type, scope_value, status) DO NOTHING`,
    [userId, courseId, expiresAt ?? null],
  );
}

export async function createPrerequisite(
  db: DatabaseConnection,
  lessonId: LessonId,
  requiredLessonId: LessonId,
  createdBy: UserId,
): Promise<void> {
  await phaseH.prerequisites.createPrerequisite(db, {
    lessonId,
    requiredLessonId,
    requiredModuleId: null,
    requiredCourseId: null,
    prerequisiteType: 'lesson_completion',
    createdBy,
  });
}
