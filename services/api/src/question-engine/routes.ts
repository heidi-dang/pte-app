import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { QuestionSessionMode, IdempotencyKey, ResponseState, QuestionSessionId, QuestionVersionId } from '@pte-app/contracts';
import { toHttpError } from './errors.js';
import type { QuestionEngineService } from './service.js';
import { serializeSession, serializeResponse, serializeSubmission } from './serializers.js';

export function registerRoutes(app: FastifyInstance, service: QuestionEngineService): void {
  // Pre-handler hook to ensure user is authenticated for all question-engine routes
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth?.userId) {
      return reply.status(401).send({ error: 'Unauthorized: Authentication required' });
    }
  });

  // POST /question-sessions/start
  app.post('/question-sessions/start', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.auth!.userId;
    const body = request.body as {
      questionId?: string;
      versionId?: string;
      mode?: QuestionSessionMode;
      durationMs?: number;
      timingProfileId?: string;
      playbackProfileId?: string;
      scoringProfileId?: string;
    };

    if (!body?.questionId || !body?.versionId || !body?.mode) {
      return reply.status(400).send({ error: 'questionId, versionId and mode are required' });
    }

    try {
      const session = await service.startSession(userId, body.questionId, body.versionId, body.mode, {
        durationMs: body.durationMs,
        timingProfileId: body.timingProfileId,
        playbackProfileId: body.playbackProfileId,
        scoringProfileId: body.scoringProfileId,
      });
      return reply.status(201).send(serializeSession(session));
    } catch (err) {
      const httpErr = toHttpError(err);
      return reply.status(httpErr.statusCode).send({ error: httpErr.message, code: httpErr.errorCode });
    }
  });

  // GET /question-sessions/:sessionId
  app.get('/question-sessions/:sessionId', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.auth!.userId;
    const { sessionId } = request.params as { sessionId: string };

    try {
      const session = await service.getSession(sessionId as QuestionSessionId, userId);
      return reply.status(200).send(serializeSession(session));
    } catch (err) {
      const httpErr = toHttpError(err);
      return reply.status(httpErr.statusCode).send({ error: httpErr.message, code: httpErr.errorCode });
    }
  });

  // POST /question-sessions/:sessionId/responses
  app.post('/question-sessions/:sessionId/responses', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.auth!.userId;
    const { sessionId } = request.params as { sessionId: string };
    const body = request.body as {
      questionVersionId?: string;
      response?: unknown;
      state?: ResponseState;
      revision?: number;
    };

    if (!body || !body.questionVersionId || body.revision === undefined || !body.state) {
      return reply.status(400).send({ error: 'questionVersionId, response, state and revision are required' });
    }

    try {
      const envelope = await service.saveResponse(
        sessionId as QuestionSessionId,
        userId,
        body.questionVersionId as QuestionVersionId,
        body.response,
        body.state,
        body.revision
      );
      return reply.status(200).send(serializeResponse(envelope));
    } catch (err) {
      const httpErr = toHttpError(err);
      return reply.status(httpErr.statusCode).send({ error: httpErr.message, code: httpErr.errorCode });
    }
  });

  // POST /question-sessions/:sessionId/playback
  app.post('/question-sessions/:sessionId/playback', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.auth!.userId;
    const { sessionId } = request.params as { sessionId: string };

    try {
      const right = await service.requestPlayback(sessionId as QuestionSessionId, userId);
      return reply.status(200).send({
        playbackRightId: right.id,
        state: right.state,
        consumedPlays: right.consumedPlays,
        allowedPlays: right.allowedPlays,
      });
    } catch (err) {
      const httpErr = toHttpError(err);
      return reply.status(httpErr.statusCode).send({ error: httpErr.message, code: httpErr.errorCode });
    }
  });

  // POST /question-sessions/:sessionId/submit
  app.post('/question-sessions/:sessionId/submit', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.auth!.userId;
    const { sessionId } = request.params as { sessionId: string };
    const body = request.body as {
      idempotencyKey?: string;
      requestFingerprint?: string;
    };

    if (!body?.idempotencyKey || !body?.requestFingerprint) {
      return reply.status(400).send({ error: 'idempotencyKey and requestFingerprint are required' });
    }

    try {
      const result = await service.submitSession(
        sessionId as QuestionSessionId,
        userId,
        body.idempotencyKey as IdempotencyKey,
        body.requestFingerprint
      );
      return reply.status(200).send(serializeSubmission(result));
    } catch (err) {
      const httpErr = toHttpError(err);
      return reply.status(httpErr.statusCode).send({ error: httpErr.message, code: httpErr.errorCode });
    }
  });

  // GET /question-sessions/:sessionId/review
  app.get('/question-sessions/:sessionId/review', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.auth!.userId;
    const { sessionId } = request.params as { sessionId: string };

    try {
      const review = await service.getReview(sessionId as QuestionSessionId, userId);
      return reply.status(200).send({
        session: serializeSession(review.session),
        response: review.response ? serializeResponse(review.response) : null,
        submission: review.submission ? serializeSubmission(review.submission) : null,
        correctAnswers: review.correctAnswers,
      });
    } catch (err) {
      const httpErr = toHttpError(err);
      return reply.status(httpErr.statusCode).send({ error: httpErr.message, code: httpErr.errorCode });
    }
  });
}
