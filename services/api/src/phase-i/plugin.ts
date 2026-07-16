import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { phaseI } from '@pte-app/database';
import type { QuestionAttemptMode, QuestionAttemptRecord } from '@pte-app/contracts';
import { isValidTransition } from '@pte-app/contracts';
import { hasPermission } from '../auth/rbac.js';
import type { UserRole } from '../auth/rbac.js';

type AnyRepo = Record<string, any>;
const repo = phaseI as unknown as AnyRepo;

function getAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return request.auth;
}

export async function phaseIPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const { db } = options;

  // ═══════════════════════════════════════════════════════
  // Start / Create attempt session
  // ═══════════════════════════════════════════════════════
  app.post('/api/v1/attempt/session/start', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const body = request.body as Record<string, unknown>;
    const lessonId = body.lessonId as string;
    const mode = body.mode as QuestionAttemptMode;
    const questionIds = body.questionIds as string[];

    if (!lessonId || !mode) {
      return reply.status(400).send({ error: 'lessonId and mode are required' });
    }
    if (!['learning', 'review', 'timed', 'mock'].includes(mode)) {
      return reply.status(400).send({ error: 'Invalid mode' });
    }
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return reply.status(400).send({ error: 'questionIds must be a non-empty array' });
    }

    // Check for existing active session
    const existingSession = await repo.attempts.getActiveSessionForUser(db, auth.userId, lessonId);
    if (existingSession) {
      const existingAttempts = await repo.attempts.getAttemptsBySession(db, existingSession.id);
      return reply.status(200).send({
        session: existingSession,
        attempts: existingAttempts,
        serverNow: new Date().toISOString(),
        recovered: true,
      });
    }

    const session = await repo.attempts.createSession(db, auth.userId, lessonId, mode);

    const attempts: QuestionAttemptRecord[] = [];
    for (const qId of questionIds) {
      const snapshotId = null; // Phase J/K will populate this
      const timeLimitSeconds = null;
      const expiresAt = null;
      const attempt = await repo.attempts.createAttempt(
        db, auth.userId, qId, lessonId, session.id, mode, snapshotId, timeLimitSeconds, expiresAt,
      );
      // Transition from created to in_progress
      await repo.attempts.updateAttemptStatus(db, attempt.id, 'in_progress');
      attempt.status = 'in_progress';
      attempts.push(attempt);
    }

    // Set current attempt to first one
    const firstAttempt = attempts[0];
    if (firstAttempt) {
      await repo.attempts.updateSessionCurrentAttempt(db, session.id, firstAttempt.id);
    }

    return reply.status(201).send({
      session: { ...session, currentAttemptId: firstAttempt ? firstAttempt.id : null },
      attempts,
      serverNow: new Date().toISOString(),
    });
  });

  // ═══════════════════════════════════════════════════════
  // Get / resume attempt session
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

    // Check for interrupted attempts and auto-mark expired
    for (const attempt of attempts) {
      if (attempt.status === 'in_progress' || attempt.status === 'autosaved') {
        if (attempt.expiresAt && new Date(attempt.expiresAt) <= new Date()) {
          if (isValidTransition(attempt.status, 'expired')) {
            await repo.attempts.updateAttemptStatus(db, attempt.id, 'expired');
            attempt.status = 'expired';
          }
        }
      }
    }

    // If session was interrupted, recover it
    if (session.status === 'paused' || session.status === 'recovered') {
      await repo.attempts.updateSessionStatus(db, sessionId, 'active');
      session.status = 'active';
    }

    const serverNow = new Date().toISOString();
    return reply.status(200).send({
      session,
      attempts,
      serverNow,
    });
  });

  // ═══════════════════════════════════════════════════════
  // Autosave response
  // ═══════════════════════════════════════════════════════
  app.post('/api/v1/attempt/autosave', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const body = request.body as Record<string, unknown>;
    const attemptId = body.attemptId as string;
    const response = body.response as Record<string, unknown>;

    if (!attemptId || !response) {
      return reply.status(400).send({ error: 'attemptId and response are required' });
    }

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    // Allow autosave for active statuses only
    if (!['in_progress', 'autosaved', 'recovered'].includes(attempt.status)) {
      return reply.status(400).send({ error: `Cannot autosave attempt in status '${attempt.status}'` });
    }

    await repo.attempts.autosaveAttempt(db, attemptId, response);

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
    const body = request.body as Record<string, unknown>;
    const attemptId = body.attemptId as string;
    const response = body.response as Record<string, unknown>;
    const idempotencyKey = body.idempotencyKey as string;

    if (!attemptId || !response || !idempotencyKey) {
      return reply.status(400).send({ error: 'attemptId, response, and idempotencyKey are required' });
    }

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    // Idempotency check
    if (attempt.idempotencyKey === idempotencyKey && attempt.status === 'submitted') {
      return reply.status(200).send({
        attempt,
        status: 'submitted',
        submittedAt: attempt.submittedAt,
        serverNow: new Date().toISOString(),
        idempotent: true,
      });
    }

    // Check for duplicate idempotency key across attempts
    const existingByKey = await repo.attempts.getAttemptByIdempotencyKey(db, auth.userId, attempt.lessonId, idempotencyKey);
    if (existingByKey && existingByKey.id !== attemptId) {
      return reply.status(409).send({
        error: 'Idempotency key already used for a different attempt',
        existingAttemptId: existingByKey.id,
      });
    }

    // Validate status transition
    if (!isValidTransition(attempt.status, 'submitted')) {
      return reply.status(400).send({
        error: `Cannot submit attempt in status '${attempt.status}'`,
        validTransitions: ['in_progress', 'autosaved', 'created', 'recovered'].filter((s) =>
          isValidTransition(attempt.status, s as any),
        ),
      });
    }

    const submitted = await repo.attempts.submitAttempt(db, attemptId, response, idempotencyKey);
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
    const body = request.body as Record<string, unknown>;
    const attemptId = body.attemptId as string;
    const mediaId = body.mediaId as string;
    const maxPlays = (body.maxPlays as number) ?? 1;

    if (!attemptId || !mediaId) {
      return reply.status(400).send({ error: 'attemptId and mediaId are required' });
    }

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    const playback = await repo.attempts.recordPlayback(db, attemptId, auth.userId, mediaId, maxPlays);

    // Update play count on attempt
    if (playback.playCount > attempt.playCount) {
      await db.pool.query(
        `UPDATE question_attempts SET play_count = $2, updated_at = NOW() WHERE id = $1`,
        [attemptId, playback.playCount],
      );
    }

    return reply.status(200).send({
      playback,
      remainingPlays: Math.max(0, playback.maxPlays - playback.playCount),
      consumed: playback.consumedAt !== null,
    });
  });
}
