import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { phaseI } from '@pte-app/database';
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

type AnyRepo = Record<string, any>;
const repo = phaseI as unknown as AnyRepo;

function getAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return request.auth;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExpired(attempt: QuestionAttemptRecord): boolean {
  if (attempt.expiresAt && new Date(attempt.expiresAt) <= new Date()) return true;
  return false;
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
  // No version snapshot — legacy/demo attempt without a renderer
  return { normalized: rawResponse };
}

// ─── Registered renderers ──────────────────────────────
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

    const body = request.body;
    if (!isObject(body)) {
      return reply.status(400).send({ error: 'Request body must be a JSON object' });
    }

    const lessonId = body.lessonId as string;
    const mode = body.mode as string;
    const questionIds = body.questionIds as unknown[];
    const questionTaskTypes = body.questionTaskTypes;

    if (!lessonId || !mode) {
      return reply.status(400).send({ error: 'lessonId and mode are required' });
    }
    if (!['learning', 'review', 'timed', 'mock'].includes(mode)) {
      return reply.status(400).send({ error: 'Invalid mode' });
    }
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return reply.status(400).send({ error: 'questionIds must be a non-empty array' });
    }
    if (!questionIds.every((id): id is string => typeof id === 'string')) {
      return reply.status(400).send({ error: 'Each questionId must be a string' });
    }

    // Validate questionTaskTypes if provided
    if (questionTaskTypes !== undefined) {
      if (!isObject(questionTaskTypes)) {
        return reply.status(400).send({ error: 'questionTaskTypes must be a plain JSON object' });
      }
      const qtt = questionTaskTypes as Record<string, unknown>;
      for (const [qId, rawType] of Object.entries(qtt)) {
        if (typeof rawType !== 'string') {
          return reply.status(400).send({
            error: `Task type for question '${qId}' must be a string, got ${typeof rawType}`,
          });
        }
        if (!resolveRenderer(rawType)) {
          return reply.status(400).send({
            error: `Unknown task type '${rawType}' for question '${qId}': no renderer registered`,
          });
        }
      }
    }

    const modeEnum = mode as QuestionAttemptMode;

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

    const session = await repo.attempts.createSession(db, auth.userId, lessonId, modeEnum);

    const attempts: QuestionAttemptRecord[] = [];
    for (const qId of questionIds) {
      // Create version snapshot if task type is provided
      let snapshotId: string | null = null;
      const taskType = questionTaskTypes?.[qId];
      if (taskType) {
        const snapshot = await repo.attempts.createVersionSnapshot(
          db, qId, taskType, {}, {},
        );
        snapshotId = snapshot.id;
      }

      const timeLimitSeconds = null;
      const expiresAt = null;
      const attempt = await repo.attempts.createAttempt(
        db, auth.userId, qId, lessonId, session.id, modeEnum, snapshotId, timeLimitSeconds, expiresAt,
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
        if (isExpired(attempt)) {
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

    const body = request.body;
    if (!isObject(body)) {
      return reply.status(400).send({ error: 'Request body must be a JSON object' });
    }

    const attemptId = body.attemptId as string;
    const response = body.response;

    if (!attemptId) {
      return reply.status(400).send({ error: 'attemptId is required' });
    }
    if (!isObject(response)) {
      return reply.status(400).send({ error: 'response must be a JSON object' });
    }

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    // Lock terminal states: no mutation on submitted/reviewable/expired
    if (['submitted', 'reviewable', 'expired'].includes(attempt.status)) {
      return reply.status(400).send({
        error: `Cannot autosave attempt in terminal status '${attempt.status}'`,
      });
    }

    // Allow autosave for active statuses only
    if (!['in_progress', 'autosaved', 'recovered'].includes(attempt.status)) {
      return reply.status(400).send({ error: `Cannot autosave attempt in status '${attempt.status}'` });
    }

    // Enforce timed/mock expiry - refuse autosave if expired
    if (isExpired(attempt)) {
      if (isValidTransition(attempt.status, 'expired')) {
        await repo.attempts.updateAttemptStatus(db, attempt.id, 'expired');
      }
      return reply.status(400).send({ error: 'Attempt has expired and cannot be modified' });
    }

    // Validate and normalize response via renderer contract
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

    const body = request.body;
    if (!isObject(body)) {
      return reply.status(400).send({ error: 'Request body must be a JSON object' });
    }

    const attemptId = body.attemptId as string;
    const response = body.response;
    const idempotencyKey = body.idempotencyKey as string;

    if (!attemptId) {
      return reply.status(400).send({ error: 'attemptId is required' });
    }
    if (!isObject(response)) {
      return reply.status(400).send({ error: 'response must be a JSON object' });
    }
    if (!idempotencyKey) {
      return reply.status(400).send({ error: 'idempotencyKey is required' });
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

    // Lock terminal states: refuse submit on submitted/reviewable/expired
    if (['submitted', 'reviewable', 'expired'].includes(attempt.status)) {
      return reply.status(400).send({
        error: `Cannot submit attempt in terminal status '${attempt.status}'`,
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

    // Enforce timed/mock expiry during submit
    if (isExpired(attempt)) {
      if (isValidTransition(attempt.status, 'expired')) {
        await repo.attempts.updateAttemptStatus(db, attempt.id, 'expired');
      }
      return reply.status(400).send({ error: 'Attempt has expired and cannot be submitted' });
    }

    // Validate and normalize response via renderer contract
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

    const body = request.body;
    if (!isObject(body)) {
      return reply.status(400).send({ error: 'Request body must be a JSON object' });
    }

    const attemptId = body.attemptId as string;
    const mediaId = body.mediaId as string;
    const rawMaxPlays = body.maxPlays;

    if (!attemptId || !mediaId) {
      return reply.status(400).send({ error: 'attemptId and mediaId are required' });
    }

    // maxPlays must be a positive integer when provided
    const maxPlays = rawMaxPlays !== undefined ? (rawMaxPlays as number) : 1;
    if (body.maxPlays !== undefined) {
      if (typeof rawMaxPlays !== 'number' || !Number.isInteger(rawMaxPlays) || rawMaxPlays < 1) {
        return reply.status(400).send({
          error: 'maxPlays must be a positive integer',
          received: rawMaxPlays,
        });
      }
    }

    const attempt = await repo.attempts.getAttempt(db, attemptId);
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' });
    if (attempt.userId !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    // Check existing playback consumption to enforce maxPlays limit
    const existing = await repo.attempts.getPlaybackConsumption(db, attemptId, mediaId);
    if (existing && existing.consumedAt !== null) {
      // Already consumed — return current state without incrementing
      return reply.status(200).send({
        playback: existing,
        remainingPlays: 0,
        consumed: true,
      });
    }
    if (existing && existing.playCount >= existing.maxPlays) {
      // Already at or over max plays — return current state without incrementing
      return reply.status(200).send({
        playback: existing,
        remainingPlays: 0,
        consumed: existing.consumedAt !== null,
      });
    }

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
