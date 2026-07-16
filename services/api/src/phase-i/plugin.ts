import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection, DatabaseClient } from '@pte-app/database';
import { phaseI, withTransaction } from '@pte-app/database';
import type { QuestionAttemptMode, QuestionAttemptRecord } from '@pte-app/contracts';
import type { JsonObject } from '@pte-app/types';
import { isValidTransition } from '@pte-app/contracts';
import { hasPermission } from '../auth/rbac.js';
import type { UserRole } from '../auth/rbac.js';
import { registerRenderer, resolveRenderer } from './renderer-registry.js';
import {
  createDemoSingleAnswerRenderer,
  createDemoTextResponseRenderer,
  createDemoAudioPolicyRenderer,
} from './demo-renderer.js';
import {
  StartSessionRequestSchema,
  AutosaveRequestSchema,
  SubmitRequestSchema,
  PlaybackRecordRequestSchema,
} from '@pte-app/schemas';
import { ZodError } from 'zod';

type AnyRepo = Record<string, any>;
const repo = phaseI as unknown as AnyRepo;

function getAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return request.auth;
}

function isExpired(attempt: QuestionAttemptRecord): boolean {
  if (attempt.expiresAt && new Date(attempt.expiresAt) <= new Date()) return true;
  return false;
}

function formatZodError(error: ZodError): string[] {
  return error.errors.map((e) => `'${e.path.join('.')}' ${e.message}`);
}

function transactionDb(db: DatabaseConnection, client: DatabaseClient): DatabaseConnection {
  return { pool: client as unknown as import('pg').Pool, config: db.config, close: () => Promise.resolve() };
}

async function validateAndNormalizeResponse(
  db: DatabaseConnection,
  attempt: QuestionAttemptRecord,
  rawResponse: Record<string, unknown>,
): Promise<{ normalized: Record<string, unknown>; errors?: string[] }> {
  if (attempt.versionSnapshotId) {
    const snapshot = await repo.attempts.getVersionSnapshot(db, attempt.versionSnapshotId);
    if (!snapshot) {
      return { normalized: rawResponse, errors: [`Version snapshot ${attempt.versionSnapshotId} not found`] };
    }
    const renderer = resolveRenderer(snapshot.taskType);
    if (!renderer) {
      return { normalized: rawResponse, errors: [`No renderer registered for task type '${snapshot.taskType}'`] };
    }
    const jsonResponse = rawResponse as unknown as JsonObject;
    const validation = renderer.validateResponse(jsonResponse);
    if (!validation.valid) {
      return { normalized: rawResponse, errors: validation.errors as string[] };
    }
    const normalized = renderer.normalizeResponse(jsonResponse) as unknown as Record<string, unknown>;
    return { normalized };
  }
  return { normalized: rawResponse };
}

function registerDemoRenderers(): void {
  registerRenderer(createDemoSingleAnswerRenderer());
  registerRenderer(createDemoTextResponseRenderer());
  registerRenderer(createDemoAudioPolicyRenderer());
}

export async function phaseIPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const { db } = options;

  registerDemoRenderers();

  // ═══════════════════════════════════════════════════════
  // Start / Create attempt session
  // ═══════════════════════════════════════════════════════
  app.post('/api/v1/attempt/session/start', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;

    const parsed = StartSessionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: formatZodError(parsed.error) });
    }
    const { lessonId, mode, questionIds, questionTaskTypes } = parsed.data;

    // Validate questionTaskTypes renderer resolution (cannot be expressed in Zod)
    if (questionTaskTypes) {
      for (const [qId, taskType] of Object.entries(questionTaskTypes)) {
        if (!resolveRenderer(taskType)) {
          return reply.status(400).send({
            error: `Unknown task type '${taskType}' for question '${qId}': no renderer registered`,
          });
        }
      }
    }

    const modeEnum = mode as unknown as QuestionAttemptMode;

    // Check for existing active session
    const existingSession = await repo.attempts.getActiveSessionForUser(db, auth.userId, lessonId);
    if (existingSession) {
      const existingAttempts = await repo.attempts.getAttemptsBySession(db, existingSession.id);

      // Auto-mark expired attempts during recovery
      for (const attempt of existingAttempts) {
        if ((attempt.status === 'in_progress' || attempt.status === 'autosaved') && isExpired(attempt)) {
          if (isValidTransition(attempt.status, 'expired')) {
            await repo.attempts.updateAttemptStatus(db, attempt.id, 'expired');
            attempt.status = 'expired';
          }
        }
      }

      // Recover paused/recovered session to active
      if (existingSession.status === 'paused' || existingSession.status === 'recovered') {
        await repo.attempts.updateSessionStatus(db, existingSession.id, 'active');
        existingSession.status = 'active';
      }

      return reply.status(200).send({
        session: existingSession,
        attempts: existingAttempts,
        serverNow: new Date().toISOString(),
        recovered: true,
      });
    }

    // Wrap session + attempt creation in a DB transaction
    const result = await withTransaction(db, async (client) => {
      const txDb = transactionDb(db, client);

      const session = await repo.attempts.createSession(txDb, auth.userId, lessonId, modeEnum);

      const attempts: QuestionAttemptRecord[] = [];
      for (const qId of questionIds) {
        let snapshotId: string | null = null;
        const taskType = questionTaskTypes?.[qId];
        if (taskType) {
          const snapshot = await repo.attempts.createVersionSnapshot(txDb, qId, taskType, {}, {});
          snapshotId = snapshot.id;
        }

        const attempt = await repo.attempts.createAttempt(
          txDb,
          auth.userId,
          qId,
          lessonId,
          session.id,
          modeEnum,
          snapshotId,
          null,
          null,
        );
        await repo.attempts.updateAttemptStatus(txDb, attempt.id, 'in_progress');
        attempt.status = 'in_progress';
        attempts.push(attempt);
      }

      const firstAttempt = attempts[0];
      if (firstAttempt) {
        await repo.attempts.updateSessionCurrentAttempt(txDb, session.id, firstAttempt.id);
      }

      return { session, attempts };
    });

    return reply.status(201).send({
      session: { ...result.session, currentAttemptId: result.attempts[0] ? result.attempts[0].id : null },
      attempts: result.attempts,
      serverNow: new Date().toISOString(),
    });
  });

  // ═══════════════════════════════════════════════════════
  // Get session state (read-only — no state mutations)
  // ═══════════════════════════════════════════════════════
  app.get('/api/v1/attempt/session/:sessionId', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { sessionId } = request.params as { sessionId: string };

    const session = await repo.attempts.getSession(db, sessionId);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    if (session.userId !== auth.userId && !hasPermission(auth.roles as UserRole[], 'content:edit')) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const attempts = await repo.attempts.getAttemptsBySession(db, sessionId);

    return reply.status(200).send({
      session,
      attempts,
      serverNow: new Date().toISOString(),
    });
  });

  // ═══════════════════════════════════════════════════════
  // Autosave response
  // ═══════════════════════════════════════════════════════
  app.post('/api/v1/attempt/autosave', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;

    const parsed = AutosaveRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: formatZodError(parsed.error) });
    }
    const { attemptId, response } = parsed.data;

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    if (['submitted', 'reviewable', 'expired'].includes(attempt.status)) {
      return reply.status(400).send({
        error: `Cannot autosave attempt in terminal status '${attempt.status}'`,
      });
    }

    if (!['in_progress', 'autosaved', 'recovered'].includes(attempt.status)) {
      return reply.status(400).send({ error: `Cannot autosave attempt in status '${attempt.status}'` });
    }

    if (isExpired(attempt)) {
      if (isValidTransition(attempt.status, 'expired')) {
        await repo.attempts.updateAttemptStatus(db, attempt.id, 'expired');
      }
      return reply.status(400).send({ error: 'Attempt has expired and cannot be modified' });
    }

    const { normalized, errors } = await validateAndNormalizeResponse(db, attempt, response);
    if (errors && errors.length > 0) {
      return reply.status(400).send({ error: 'Invalid response', details: errors });
    }

    await repo.attempts.autosaveAttempt(db, attemptId, normalized);

    return reply.status(200).send({
      attemptId,
      status: 'autosaved',
      lastAutosavedAt: new Date().toISOString(),
      serverNow: new Date().toISOString(),
    });
  });

  // ═══════════════════════════════════════════════════════
  // Submit response
  // ═══════════════════════════════════════════════════════
  app.post('/api/v1/attempt/submit', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;

    const parsed = SubmitRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: formatZodError(parsed.error) });
    }
    const { attemptId, response, idempotencyKey } = parsed.data;

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    // Idempotency check — same key on same submitted attempt returns 200
    if (attempt.idempotencyKey === idempotencyKey && attempt.status === 'submitted') {
      return reply.status(200).send({
        attempt,
        status: 'submitted',
        submittedAt: attempt.submittedAt,
        serverNow: new Date().toISOString(),
        idempotent: true,
      });
    }

    // Check for duplicate idempotency key across different attempts
    const existingByKey = await repo.attempts.getAttemptByIdempotencyKey(
      db,
      auth.userId,
      attempt.lessonId,
      idempotencyKey,
    );
    if (existingByKey && existingByKey.id !== attemptId) {
      return reply.status(409).send({
        error: 'Idempotency key already used for a different attempt',
        existingAttemptId: existingByKey.id,
      });
    }

    if (['submitted', 'reviewable', 'expired'].includes(attempt.status)) {
      return reply.status(400).send({
        error: `Cannot submit attempt in terminal status '${attempt.status}'`,
      });
    }

    if (!isValidTransition(attempt.status, 'submitted')) {
      return reply.status(400).send({
        error: `Cannot submit attempt in status '${attempt.status}'`,
      });
    }

    if (isExpired(attempt)) {
      if (isValidTransition(attempt.status, 'expired')) {
        await repo.attempts.updateAttemptStatus(db, attempt.id, 'expired');
      }
      return reply.status(400).send({ error: 'Attempt has expired and cannot be submitted' });
    }

    const { normalized, errors } = await validateAndNormalizeResponse(db, attempt, response);
    if (errors && errors.length > 0) {
      return reply.status(400).send({ error: 'Invalid response', details: errors });
    }

    const submitted = await repo.attempts.submitAttempt(db, attemptId, normalized, idempotencyKey);
    if (!submitted) {
      return reply.status(409).send({ error: 'Attempt was already submitted or is in a terminal state' });
    }

    return reply.status(200).send({
      attempt: submitted,
      status: 'submitted',
      submittedAt: submitted.submittedAt,
      serverNow: new Date().toISOString(),
      idempotent: false,
    });
  });

  // ═══════════════════════════════════════════════════════
  // Get review state
  // ═══════════════════════════════════════════════════════
  app.get('/api/v1/attempt/:attemptId/review', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { attemptId } = request.params as { attemptId: string };

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId && !hasPermission(auth.roles as UserRole[], 'content:edit')) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (attempt.status !== 'submitted' && attempt.status !== 'reviewable') {
      return reply.status(400).send({
        error: 'Attempt is not in a reviewable state',
        status: attempt.status,
      });
    }

    const playback = await repo.attempts.getPlaybackConsumptionByAttempt(db, attemptId);

    const remainingSeconds = attempt.expiresAt
      ? Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000))
      : null;

    return reply.status(200).send({
      attemptId: attempt.id,
      status: attempt.status,
      response: attempt.response,
      mode: attempt.mode,
      startedAt: attempt.startedAt,
      lastAutosavedAt: attempt.lastAutosavedAt,
      submittedAt: attempt.submittedAt,
      timeLimitSeconds: attempt.timeLimitSeconds,
      serverNow: new Date().toISOString(),
      remainingSeconds,
      playback,
    });
  });

  // ═══════════════════════════════════════════════════════
  // Record playback consumption (Phase K foundation)
  // ═══════════════════════════════════════════════════════
  app.post('/api/v1/attempt/playback/record', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;

    const parsed = PlaybackRecordRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: formatZodError(parsed.error) });
    }
    const { attemptId, mediaId, maxPlays } = parsed.data;

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    const existing = await repo.attempts.getPlaybackConsumption(db, attemptId, mediaId);
    if (existing && existing.consumedAt !== null) {
      return reply.status(200).send({
        playback: existing,
        remainingPlays: 0,
        consumed: true,
      });
    }
    if (existing && existing.playCount >= existing.maxPlays) {
      return reply.status(200).send({
        playback: existing,
        remainingPlays: 0,
        consumed: existing.consumedAt !== null,
      });
    }

    const playback = await repo.attempts.recordPlayback(db, attemptId, auth.userId, mediaId, maxPlays);

    if (playback.playCount > attempt.playCount) {
      await db.pool.query(`UPDATE question_attempts SET play_count = $2, updated_at = NOW() WHERE id = $1`, [
        attemptId,
        playback.playCount,
      ]);
    }

    return reply.status(200).send({
      playback,
      remainingPlays: Math.max(0, playback.maxPlays - playback.playCount),
      consumed: playback.consumedAt !== null,
    });
  });
}
