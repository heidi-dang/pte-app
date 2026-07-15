import type { DatabaseConnection } from '../../client.js';
import type {
  LessonId,
  LessonQuizId,
  LessonQuizItemId,
  LessonQuizAttemptId,
  LessonQuizRecord,
  LessonQuizItemRecord,
  LessonQuizItemType,
  LessonQuizAttemptRecord,
} from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

export interface CreateQuizInput {
  readonly lessonId: LessonId;
  readonly title: string;
  readonly passThreshold: number;
  readonly isRequired: boolean;
}

export interface CreateQuizItemInput {
  readonly quizId: LessonQuizId;
  readonly itemType: LessonQuizItemType;
  readonly question: string;
  readonly options: readonly string[];
  readonly correctAnswers: readonly number[];
  readonly orderPosition: number;
  readonly explanation: string;
}

export interface CreateQuizAttemptInput {
  readonly quizId: LessonQuizId;
  readonly userId: string;
  readonly score: number;
  readonly totalItems: number;
  readonly passed: boolean;
  readonly answers: readonly number[][];
  readonly submissionId: string;
}

export async function createQuiz(
  connection: DatabaseConnection,
  input: CreateQuizInput,
): Promise<LessonQuizRecord> {
  const id = randomUUID() as LessonQuizId;

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO lesson_quizzes (id, lesson_id, title, pass_threshold, is_required)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (lesson_id) DO NOTHING
     RETURNING id, lesson_id as "lessonId", title, pass_threshold as "passThreshold", is_required as "isRequired"`,
    [id, input.lessonId, input.title, input.passThreshold, input.isRequired],
  );

  const row = result.rows[0];
  if (!row) {
    const existing = await connection.pool.query<Record<string, unknown>>(
      `SELECT id, lesson_id as "lessonId", title, pass_threshold as "passThreshold", is_required as "isRequired"
       FROM lesson_quizzes WHERE lesson_id = $1`,
      [input.lessonId],
    );
    const existingRow = existing.rows[0];
    if (!existingRow) throw new Error('Failed to create quiz');
    return existingRow as unknown as LessonQuizRecord;
  }
  return row as unknown as LessonQuizRecord;
}

export async function getQuizForLesson(
  connection: DatabaseConnection,
  lessonId: LessonId,
): Promise<LessonQuizRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, lesson_id as "lessonId", title, pass_threshold as "passThreshold", is_required as "isRequired"
     FROM lesson_quizzes WHERE lesson_id = $1`,
    [lessonId],
  );
  return result.rows[0] as unknown as LessonQuizRecord | undefined;
}

export async function createQuizItem(
  connection: DatabaseConnection,
  input: CreateQuizItemInput,
): Promise<LessonQuizItemRecord> {
  const id = randomUUID() as LessonQuizItemId;

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO lesson_quiz_items (id, quiz_id, item_type, question, options, correct_answers, order_position, explanation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, quiz_id as "quizId", item_type as "itemType", question, options,
       correct_answers as "correctAnswers", order_position as "orderPosition", explanation`,
    [
      id,
      input.quizId,
      input.itemType,
      input.question,
      JSON.stringify(input.options),
      JSON.stringify(input.correctAnswers),
      input.orderPosition,
      input.explanation,
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create quiz item');
  return row as unknown as LessonQuizItemRecord;
}

export async function getQuizItems(
  connection: DatabaseConnection,
  quizId: LessonQuizId,
): Promise<LessonQuizItemRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, quiz_id as "quizId", item_type as "itemType", question, options,
      correct_answers as "correctAnswers", order_position as "orderPosition", explanation
     FROM lesson_quiz_items WHERE quiz_id = $1
     ORDER BY order_position ASC`,
    [quizId],
  );
  return result.rows as unknown as LessonQuizItemRecord[];
}

export async function createQuizAttempt(
  connection: DatabaseConnection,
  input: CreateQuizAttemptInput,
): Promise<LessonQuizAttemptRecord> {
  const id = randomUUID() as LessonQuizAttemptId;

  const prevResult = await connection.pool.query<Record<string, unknown>>(
    `SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
     FROM lesson_quiz_attempts WHERE quiz_id = $1 AND user_id = $2`,
    [input.quizId, input.userId],
  );
  const attemptNumber = (prevResult.rows[0]?.next_attempt as number) ?? 1;

  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO lesson_quiz_attempts (id, quiz_id, user_id, score, total_items, passed, answers, attempt_number, submission_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (quiz_id, user_id, submission_id) DO NOTHING
     RETURNING id, quiz_id as "quizId", user_id as "userId", score, total_items as "totalItems",
       passed, answers, attempt_number as "attemptNumber", submission_id as "submissionId", created_at as "createdAt"`,
    [
      id,
      input.quizId,
      input.userId,
      input.score,
      input.totalItems,
      input.passed,
      JSON.stringify(input.answers),
      attemptNumber,
      input.submissionId,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    const existing = await connection.pool.query<Record<string, unknown>>(
      `SELECT id, quiz_id as "quizId", user_id as "userId", score, total_items as "totalItems",
        passed, answers, attempt_number as "attemptNumber", submission_id as "submissionId", created_at as "createdAt"
       FROM lesson_quiz_attempts WHERE quiz_id = $1 AND user_id = $2 AND submission_id = $3`,
      [input.quizId, input.userId, input.submissionId],
    );
    const existingRow = existing.rows[0];
    if (!existingRow) throw new Error('Failed to create quiz attempt');
    return existingRow as unknown as LessonQuizAttemptRecord;
  }
  return row as unknown as LessonQuizAttemptRecord;
}

export async function getQuizAttempts(
  connection: DatabaseConnection,
  quizId: LessonQuizId,
  userId: string,
): Promise<LessonQuizAttemptRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, quiz_id as "quizId", user_id as "userId", score, total_items as "totalItems",
      passed, answers, attempt_number as "attemptNumber", submission_id as "submissionId", created_at as "createdAt"
     FROM lesson_quiz_attempts WHERE quiz_id = $1 AND user_id = $2
     ORDER BY created_at DESC`,
    [quizId, userId],
  );
  return result.rows as unknown as LessonQuizAttemptRecord[];
}
