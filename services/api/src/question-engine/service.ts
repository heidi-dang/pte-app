import { randomUUID } from 'node:crypto';
import { withTransaction, type DatabaseConnection } from '@pte-app/database';
import type {
  QuestionSession,
  QuestionResponseEnvelope,
  SubmissionResult,
  QuestionSessionEvent,
  PlaybackRight,
  QuestionSessionId,
  QuestionVersionId,
  QuestionId,
  QuestionSessionMode,
  SessionState,
  PlaybackRightId,
  PlaybackProfileId,
  IdempotencyKey,
  ResponseState,
  ResponseRevision,
  QuestionEventId,
  EventSequence,
  QuestionAccessPolicy,
  QuestionTypeHandler
} from '@pte-app/contracts';
import {
  createEngineError,
  validateTransition,
  createTimerSnapshot,
  createDeadline,
  canStartPlayback,
  markPlaybackStarted,
  markPlaybackConsumed,
  recordPlaybackFailure,
  validateEventSequence,
  detectIdempotencyConflict,
  type HandlerRegistry
} from '@pte-app/domain';
import type { QuestionSessionRepository } from './repository.js';

export class QuestionEngineService {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly repo: QuestionSessionRepository,
    private readonly registry: HandlerRegistry,
    private readonly accessPolicy: QuestionAccessPolicy
  ) {}

  public async startSession(
    userId: string,
    questionId: string,
    versionId: string,
    mode: QuestionSessionMode,
    config: {
      timingProfileId?: string;
      playbackProfileId?: string;
      scoringProfileId?: string;
      durationMs?: number;
    }
  ): Promise<QuestionSession> {
    const access = await this.accessPolicy.canStartSession({
      userId,
      questionType: '', // We don't have the question loaded yet, but access policy handles user check
      sessionMode: mode,
    });
    if (!access.allowed) {
      throw createEngineError('SESSION_NOT_OWNED', access.reason || 'Access denied');
    }

    const sessionId = randomUUID() as QuestionSessionId;
    const serverDeadline = config.durationMs
      ? createDeadline(new Date().toISOString(), config.durationMs)
      : undefined;

    return withTransaction(this.connection, async (tx) => {
      const session = await this.repo.createSession(
        {
          id: sessionId,
          userId,
          questionId: questionId as QuestionId,
          questionVersionId: versionId as QuestionVersionId,
          questionType: '', // to be populated or resolved
          mode,
          state: 'created',
          timingProfileId: config.timingProfileId,
          playbackProfileId: config.playbackProfileId,
          scoringProfileId: config.scoringProfileId,
          serverDeadline,
        },
        tx
      );

      // Log event
      await this.logEvent(
        sessionId,
        'session.created',
        { questionId, versionId, mode },
        tx
      );

      // Transition to active
      const updatedSession = {
        ...session,
        state: 'active' as SessionState,
        startedAt: new Date().toISOString(),
      };
      await this.repo.updateSession(updatedSession, tx);
      await this.logEvent(sessionId, 'session.started', {}, tx);

      // Initialize playback right if playbackProfileId exists
      if (config.playbackProfileId) {
        const right: PlaybackRight = {
          id: sessionId as unknown as PlaybackRightId, // session-bound playback right
          playbackProfileId: config.playbackProfileId as PlaybackProfileId,
          allowedPlays: 1, // Default or resolved from profile
          consumedPlays: 0,
          state: 'allowed',
        };
        await this.repo.savePlaybackRight(right, tx);
        await this.logEvent(sessionId, 'playback.ready', { playbackProfileId: config.playbackProfileId }, tx);
      }

      return updatedSession;
    });
  }

  public async getSession(sessionId: QuestionSessionId, userId: string): Promise<QuestionSession> {
    const session = await this.repo.getSession(sessionId);
    if (!session) {
      throw createEngineError('SESSION_NOT_OWNED', 'Session not found');
    }
    // Simple owner check
    // Wait, row mapping doesn't return user_id, but the repository can check it or we check it.
    // Let's check session exists and throw if owner mismatch.
    // To do this fully, our getSession could verify owner. Since session table tracks user_id, let's query it or check it.
    // Let's add user owner validation:
    const ownerResult = await this.connection.pool.query(
      `SELECT user_id FROM question_sessions WHERE id = $1`,
      [sessionId]
    );
    if (ownerResult.rows.length === 0 || ownerResult.rows[0].user_id !== userId) {
      throw createEngineError('SESSION_NOT_OWNED', 'Not authorized to access this session');
    }

    return session;
  }

  public async saveResponse(
    sessionId: QuestionSessionId,
    userId: string,
    versionId: QuestionVersionId,
    payload: unknown,
    state: ResponseState,
    revision: number
  ): Promise<QuestionResponseEnvelope> {
    const session = await this.getSession(sessionId, userId);
    if (session.state !== 'active' && session.state !== 'paused') {
      throw createEngineError('INVALID_SESSION_TRANSITION', 'Session is not in writable state');
    }

    // Check expiration if server deadline is set
    const dbDeadlineResult = await this.connection.pool.query(
      `SELECT server_deadline FROM question_sessions WHERE id = $1`,
      [sessionId]
    );
    const deadline = dbDeadlineResult.rows[0]?.server_deadline;
    if (deadline && new Date(deadline).getTime() < Date.now()) {
      // Transition to expired
      await withTransaction(this.connection, async (tx) => {
        await this.repo.updateSession({
          ...session,
          state: 'expired',
          expiredAt: new Date().toISOString(),
        }, tx);
        await this.logEvent(sessionId, 'timer.expired', {}, tx);
      });
      throw createEngineError('SESSION_EXPIRED', 'Session timer has expired');
    }

    return withTransaction(this.connection, async (tx) => {
      const latest = await this.repo.getLatestResponse(sessionId, tx);
      if (latest && latest.revision >= revision) {
        throw createEngineError('STALE_RESPONSE_REVISION', 'Response revision is stale');
      }

      const envelope: QuestionResponseEnvelope = {
        sessionId,
        questionVersionId: versionId,
        questionType: session.questionType || '',
        revision: revision as ResponseRevision,
        state,
        response: payload,
        updatedAt: new Date().toISOString(),
      };

      await this.repo.saveResponse(envelope, tx);
      await this.logEvent(sessionId, 'response.saved', { revision, state }, tx);

      return envelope;
    });
  }

  public async requestPlayback(sessionId: QuestionSessionId, userId: string): Promise<PlaybackRight> {
    const session = await this.getSession(sessionId, userId);
    if (session.state !== 'active') {
      throw createEngineError('PLAYBACK_NOT_ALLOWED', 'Session is not active');
    }

    return withTransaction(this.connection, async (tx) => {
      const right = await this.repo.getPlaybackRight(sessionId, tx);
      if (!right) {
        throw createEngineError('PLAYBACK_NOT_ALLOWED', 'No playback configuration for this session');
      }

      if (!canStartPlayback(right)) {
        throw createEngineError('PLAYBACK_ALREADY_CONSUMED', 'Audio playback quota has been reached');
      }

      const now = new Date().toISOString();
      const updatedRight = markPlaybackConsumed(markPlaybackStarted(right, now), now);
      await this.repo.savePlaybackRight(updatedRight, tx);
      await this.logEvent(sessionId, 'playback.started', { consumedPlays: updatedRight.consumedPlays }, tx);

      return updatedRight;
    });
  }

  public async submitSession(
    sessionId: QuestionSessionId,
    userId: string,
    idempotencyKey: IdempotencyKey,
    requestFingerprint: string
  ): Promise<SubmissionResult> {
    const session = await this.getSession(sessionId, userId);

    return withTransaction(this.connection, async (tx) => {
      // Check for existing idempotency record
      const existing = await this.repo.findIdempotencyRecord(sessionId, idempotencyKey, tx);
      if (existing) {
        const detection = detectIdempotencyConflict(existing, requestFingerprint);
        if (detection === 'conflict') {
          throw createEngineError('IDEMPOTENCY_CONFLICT', 'Idempotency conflict detected for this key');
        }
        return JSON.parse(existing.resultPayload) as SubmissionResult;
      }

      if (session.state === 'submitted') {
        throw createEngineError('SESSION_ALREADY_SUBMITTED', 'Session has already been submitted');
      }

      validateTransition(session.state, 'submitting');

      // Update state to submitting
      await this.repo.updateSession({
        ...session,
        state: 'submitting',
      }, tx);
      await this.logEvent(sessionId, 'submission.started', {}, tx);

      const latestResponse = await this.repo.getLatestResponse(sessionId, tx);
      const revision = latestResponse ? latestResponse.revision : 0;
      const responsePayload = latestResponse ? latestResponse.response : null;

      const submissionId = randomUUID() as QuestionSubmissionId;
      const submissionResult: SubmissionResult = {
        submissionId,
        sessionId,
        questionVersionId: session.questionVersionId,
        status: 'accepted',
        idempotencyKey,
        submittedAt: new Date().toISOString(),
      };

      // Persist submission
      await this.repo.createSubmission(submissionResult, responsePayload, revision, requestFingerprint, tx);

      // Finalize transition to submitted
      await this.repo.updateSession({
        ...session,
        state: 'submitted',
        submittedAt: new Date().toISOString(),
      }, tx);
      await this.logEvent(sessionId, 'submission.completed', { submissionId }, tx);

      // Persist idempotency record
      await this.repo.createIdempotencyRecord({
        id: randomUUID(),
        sessionId,
        idempotencyKey,
        requestFingerprint,
        resultPayload: JSON.stringify(submissionResult),
        createdAt: new Date().toISOString(),
      }, tx);

      return submissionResult;
    });
  }

  public async getReview(
    sessionId: QuestionSessionId,
    userId: string
  ): Promise<{
    session: QuestionSession;
    response: QuestionResponseEnvelope | null;
    submission: SubmissionResult | null;
    correctAnswers: unknown;
  }> {
    const session = await this.getSession(sessionId, userId);
    if (session.state !== 'submitted' && session.state !== 'expired') {
      throw createEngineError('TRANSCRIPT_NOT_AUTHORISED', 'Review is only allowed after submission/expiration');
    }

    const response = await this.repo.getLatestResponse(sessionId);
    const submission = await this.repo.getSubmission(sessionId);

    // Mock or resolved correct answers
    const correctAnswers = {
      // Safe correct answer payload loaded separately
      note: 'Correct answers loaded after session submission verification',
    };

    return {
      session,
      response,
      submission,
      correctAnswers,
    };
  }

  private async logEvent(
    sessionId: QuestionSessionId,
    type: any,
    payload: Record<string, unknown>,
    tx?: DatabaseClient
  ): Promise<void> {
    const events = await this.repo.getEvents(sessionId, tx);
    const sequence = events.length as EventSequence;
    const event: QuestionSessionEvent = {
      id: randomUUID() as QuestionEventId,
      sessionId,
      sequence,
      type,
      payload,
      occurredAt: new Date().toISOString(),
    };
    await this.repo.insertEvent(event, tx);
  }
}
