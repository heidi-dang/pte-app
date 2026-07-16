import type { DatabaseConnection } from '../../client.js';
import type {
  QuestionAttemptRecord,
  QuestionSessionRecord,
  QuestionVersionSnapshotRecord,
  PlaybackConsumptionRecord,
  QuestionAttemptStatus,
  QuestionAttemptMode,
  QuestionAttemptId,
  QuestionSessionId,
  PlaybackConsumptionId,
  QuestionVersionSnapshotId,
} from '@pte-app/contracts';
import { randomUUID } from 'node:crypto';

// ─── Sessions ─────────────────────────────────────────────────

export async function createSession(
  connection: DatabaseConnection,
  userId: string,
  lessonId: string,
  mode: QuestionAttemptMode,
): Promise<QuestionSessionRecord> {
  const id = randomUUID() as unknown as QuestionSessionId;
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO question_sessions (id, user_id, lesson_id, mode, status, started_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'active', NOW(), NOW(), NOW())
     RETURNING id, user_id as "userId", lesson_id as "lessonId", mode, status,
       current_attempt_id as "currentAttemptId",
       started_at as "startedAt", completed_at as "completedAt",
       expires_at as "expiresAt", metadata, created_at as "createdAt",
       updated_at as "updatedAt"`,
    [id, userId, lessonId, mode],
  );
  return result.rows[0] as unknown as QuestionSessionRecord;
}

export async function getSession(
  connection: DatabaseConnection,
  sessionId: string,
): Promise<QuestionSessionRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", lesson_id as "lessonId", mode, status,
       current_attempt_id as "currentAttemptId",
       started_at as "startedAt", completed_at as "completedAt",
       expires_at as "expiresAt", metadata, created_at as "createdAt",
       updated_at as "updatedAt"
     FROM question_sessions WHERE id = $1`,
    [sessionId],
  );
  return result.rows[0] as unknown as QuestionSessionRecord | undefined;
}

export async function getActiveSessionForUser(
  connection: DatabaseConnection,
  userId: string,
  lessonId: string,
): Promise<QuestionSessionRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", lesson_id as "lessonId", mode, status,
       current_attempt_id as "currentAttemptId",
       started_at as "startedAt", completed_at as "completedAt",
       expires_at as "expiresAt", metadata, created_at as "createdAt",
       updated_at as "updatedAt"
     FROM question_sessions
     WHERE user_id = $1 AND lesson_id = $2 AND status IN ('active', 'paused', 'recovered')
     ORDER BY created_at DESC LIMIT 1`,
    [userId, lessonId],
  );
  return result.rows[0] as unknown as QuestionSessionRecord | undefined;
}

export async function updateSessionStatus(
  connection: DatabaseConnection,
  sessionId: string,
  status: string,
): Promise<void> {
  await connection.pool.query(
    `UPDATE question_sessions SET status = $2, updated_at = NOW() WHERE id = $1`,
    [sessionId, status],
  );
}

export async function updateSessionCurrentAttempt(
  connection: DatabaseConnection,
  sessionId: string,
  attemptId: string,
): Promise<void> {
  await connection.pool.query(
    `UPDATE question_sessions SET current_attempt_id = $2, updated_at = NOW() WHERE id = $1`,
    [sessionId, attemptId],
  );
}

// ─── Version Snapshots ────────────────────────────────────────

export async function getVersionSnapshot(
  connection: DatabaseConnection,
  snapshotId: string,
): Promise<QuestionVersionSnapshotRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, question_id as "questionId", version, task_type as "taskType", prompt,
       media_refs as "mediaRefs", scoring_principles as "scoringPrinciples",
       time_limit_seconds as "timeLimitSeconds", preparation_seconds as "preparationSeconds",
       snapshot, created_at as "createdAt"
     FROM question_version_snapshots WHERE id = $1`,
    [snapshotId],
  );
  return result.rows[0] as unknown as QuestionVersionSnapshotRecord | undefined;
}

export async function createVersionSnapshot(
  connection: DatabaseConnection,
  questionId: string,
  taskType: string,
  prompt: Record<string, unknown>,
  snapshot: Record<string, unknown>,
): Promise<QuestionVersionSnapshotRecord> {
  const id = randomUUID() as unknown as QuestionVersionSnapshotId;
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO question_version_snapshots (id, question_id, task_type, prompt, snapshot, created_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW())
     RETURNING id, question_id as "questionId", version, task_type as "taskType", prompt,
       media_refs as "mediaRefs", scoring_principles as "scoringPrinciples",
       time_limit_seconds as "timeLimitSeconds", preparation_seconds as "preparationSeconds",
       snapshot, created_at as "createdAt"`,
    [id, questionId, taskType, JSON.stringify(prompt), JSON.stringify(snapshot)],
  );
  return result.rows[0] as unknown as QuestionVersionSnapshotRecord;
}

// ─── Attempts ─────────────────────────────────────────────────

export async function createAttempt(
  connection: DatabaseConnection,
  userId: string,
  questionId: string,
  lessonId: string,
  sessionId: string,
  mode: QuestionAttemptMode,
  snapshotId: string | null,
  timeLimitSeconds: number | null,
  expiresAt: string | null,
): Promise<QuestionAttemptRecord> {
  const id = randomUUID() as unknown as QuestionAttemptId;
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO question_attempts (id, user_id, question_id, lesson_id, session_id,
       status, mode, version_snapshot_id, started_at, expires_at, time_limit_seconds,
       created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'created', $6, $7, NOW(), $8, $9, NOW(), NOW())
     RETURNING id, user_id as "userId", question_id as "questionId",
       lesson_id as "lessonId", session_id as "sessionId",
       status, mode, version_snapshot_id as "versionSnapshotId",
       response, started_at as "startedAt",
       last_autosaved_at as "lastAutosavedAt", submitted_at as "submittedAt",
       expires_at as "expiresAt", time_limit_seconds as "timeLimitSeconds",
       idempotency_key as "idempotencyKey", play_count as "playCount",
       created_at as "createdAt", updated_at as "updatedAt"`,
    [id, userId, questionId, lessonId, sessionId, mode, snapshotId, expiresAt, timeLimitSeconds],
  );
  return result.rows[0] as unknown as QuestionAttemptRecord;
}

export async function getAttempt(
  connection: DatabaseConnection,
  attemptId: string,
): Promise<QuestionAttemptRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", question_id as "questionId",
       lesson_id as "lessonId", session_id as "sessionId",
       status, mode, version_snapshot_id as "versionSnapshotId",
       response, started_at as "startedAt",
       last_autosaved_at as "lastAutosavedAt", submitted_at as "submittedAt",
       expires_at as "expiresAt", time_limit_seconds as "timeLimitSeconds",
       idempotency_key as "idempotencyKey", play_count as "playCount",
       created_at as "createdAt", updated_at as "updatedAt"
     FROM question_attempts WHERE id = $1`,
    [attemptId],
  );
  return result.rows[0] as unknown as QuestionAttemptRecord | undefined;
}

export async function getAttemptsBySession(
  connection: DatabaseConnection,
  sessionId: string,
): Promise<QuestionAttemptRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", question_id as "questionId",
       lesson_id as "lessonId", session_id as "sessionId",
       status, mode, version_snapshot_id as "versionSnapshotId",
       response, started_at as "startedAt",
       last_autosaved_at as "lastAutosavedAt", submitted_at as "submittedAt",
       expires_at as "expiresAt", time_limit_seconds as "timeLimitSeconds",
       idempotency_key as "idempotencyKey", play_count as "playCount",
       created_at as "createdAt", updated_at as "updatedAt"
     FROM question_attempts WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId],
  );
  return result.rows as unknown as QuestionAttemptRecord[];
}

export async function getAttemptByUserAndLesson(
  connection: DatabaseConnection,
  userId: string,
  lessonId: string,
  questionId: string,
): Promise<QuestionAttemptRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", question_id as "questionId",
       lesson_id as "lessonId", session_id as "sessionId",
       status, mode, version_snapshot_id as "versionSnapshotId",
       response, started_at as "startedAt",
       last_autosaved_at as "lastAutosavedAt", submitted_at as "submittedAt",
       expires_at as "expiresAt", time_limit_seconds as "timeLimitSeconds",
       idempotency_key as "idempotencyKey", play_count as "playCount",
       created_at as "createdAt", updated_at as "updatedAt"
     FROM question_attempts
     WHERE user_id = $1 AND lesson_id = $2 AND question_id = $3
     ORDER BY created_at DESC LIMIT 1`,
    [userId, lessonId, questionId],
  );
  return result.rows[0] as unknown as QuestionAttemptRecord | undefined;
}

export async function updateAttemptStatus(
  connection: DatabaseConnection,
  attemptId: string,
  status: QuestionAttemptStatus,
): Promise<void> {
  await connection.pool.query(
    `UPDATE question_attempts SET status = $2, updated_at = NOW() WHERE id = $1`,
    [attemptId, status],
  );
}

export async function autosaveAttempt(
  connection: DatabaseConnection,
  attemptId: string,
  response: Record<string, unknown>,
): Promise<void> {
  await connection.pool.query(
    `UPDATE question_attempts SET status = 'autosaved', response = $2::jsonb,
       last_autosaved_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [attemptId, JSON.stringify(response)],
  );
}

export async function submitAttempt(
  connection: DatabaseConnection,
  attemptId: string,
  response: Record<string, unknown>,
  idempotencyKey: string,
): Promise<QuestionAttemptRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE question_attempts SET status = 'submitted', response = $2::jsonb,
       submitted_at = NOW(), idempotency_key = $3, updated_at = NOW()
     WHERE id = $1 AND status IN ('in_progress', 'autosaved', 'created', 'recovered')
     RETURNING id, user_id as "userId", question_id as "questionId",
       lesson_id as "lessonId", session_id as "sessionId",
       status, mode, version_snapshot_id as "versionSnapshotId",
       response, started_at as "startedAt",
       last_autosaved_at as "lastAutosavedAt", submitted_at as "submittedAt",
       expires_at as "expiresAt", time_limit_seconds as "timeLimitSeconds",
       idempotency_key as "idempotencyKey", play_count as "playCount",
       created_at as "createdAt", updated_at as "updatedAt"`,
    [attemptId, JSON.stringify(response), idempotencyKey],
  );
  return result.rows[0] as unknown as QuestionAttemptRecord | undefined;
}

export async function finalizeAttemptReview(
  connection: DatabaseConnection,
  attemptId: string,
): Promise<void> {
  await connection.pool.query(
    `UPDATE question_attempts SET status = 'reviewable', updated_at = NOW()
     WHERE id = $1 AND status = 'submitted'`,
    [attemptId],
  );
}

export async function getAttemptByIdempotencyKey(
  connection: DatabaseConnection,
  userId: string,
  lessonId: string,
  idempotencyKey: string,
): Promise<QuestionAttemptRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, user_id as "userId", question_id as "questionId",
       lesson_id as "lessonId", session_id as "sessionId",
       status, mode, version_snapshot_id as "versionSnapshotId",
       response, started_at as "startedAt",
       last_autosaved_at as "lastAutosavedAt", submitted_at as "submittedAt",
       expires_at as "expiresAt", time_limit_seconds as "timeLimitSeconds",
       idempotency_key as "idempotencyKey", play_count as "playCount",
       created_at as "createdAt", updated_at as "updatedAt"
     FROM question_attempts
     WHERE user_id = $1 AND lesson_id = $2 AND idempotency_key = $3`,
    [userId, lessonId, idempotencyKey],
  );
  return result.rows[0] as unknown as QuestionAttemptRecord | undefined;
}

// ─── Playback Consumption ─────────────────────────────────────

export async function getPlaybackConsumption(
  connection: DatabaseConnection,
  attemptId: string,
  mediaId: string,
): Promise<PlaybackConsumptionRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, attempt_id as "attemptId", user_id as "userId",
       media_id as "mediaId", play_count as "playCount", max_plays as "maxPlays",
       first_played_at as "firstPlayedAt", last_played_at as "lastPlayedAt",
       consumed_at as "consumedAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM playback_consumption WHERE attempt_id = $1 AND media_id = $2`,
    [attemptId, mediaId],
  );
  return result.rows[0] as unknown as PlaybackConsumptionRecord | undefined;
}

export async function getPlaybackConsumptionByAttempt(
  connection: DatabaseConnection,
  attemptId: string,
): Promise<PlaybackConsumptionRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, attempt_id as "attemptId", user_id as "userId",
       media_id as "mediaId", play_count as "playCount", max_plays as "maxPlays",
       first_played_at as "firstPlayedAt", last_played_at as "lastPlayedAt",
       consumed_at as "consumedAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM playback_consumption WHERE attempt_id = $1 ORDER BY created_at ASC`,
    [attemptId],
  );
  return result.rows as unknown as PlaybackConsumptionRecord[];
}

export async function recordPlayback(
  connection: DatabaseConnection,
  attemptId: string,
  userId: string,
  mediaId: string,
  maxPlays: number,
): Promise<PlaybackConsumptionRecord> {
  const id = randomUUID() as unknown as PlaybackConsumptionId;
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO playback_consumption (id, attempt_id, user_id, media_id, play_count, max_plays,
       first_played_at, last_played_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 1, $5, NOW(), NOW(), NOW(), NOW())
     ON CONFLICT (attempt_id, media_id) DO UPDATE SET
       play_count = playback_consumption.play_count + 1,
       last_played_at = NOW(),
       consumed_at = CASE
         WHEN playback_consumption.play_count + 1 >= playback_consumption.max_plays THEN NOW()
         ELSE playback_consumption.consumed_at
       END,
       updated_at = NOW()
     RETURNING id, attempt_id as "attemptId", user_id as "userId",
       media_id as "mediaId", play_count as "playCount", max_plays as "maxPlays",
       first_played_at as "firstPlayedAt", last_played_at as "lastPlayedAt",
       consumed_at as "consumedAt", created_at as "createdAt", updated_at as "updatedAt"`,
    [id, attemptId, userId, mediaId, maxPlays],
  );
  return result.rows[0] as unknown as PlaybackConsumptionRecord;
}
