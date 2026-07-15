import type { DatabaseConnection, DatabaseClient } from '@pte-app/database';
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
  PlaybackState,
  QuestionSubmissionId,
  IdempotencyKey,
  ResponseState,
  ResponseRevision,
  QuestionEventId,
  EventSequence,
  QuestionProgressEventType,
} from '@pte-app/contracts';
import type { IdempotencyRecord } from '@pte-app/domain';

type Queryable = DatabaseConnection | DatabaseClient;

function getPool(q: Queryable) {
  return 'pool' in q ? q.pool : q;
}

export class QuestionSessionRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  public async createSession(
    session: Omit<QuestionSession, 'createdAt' | 'updatedAt'> & {
      userId: string;
      questionId: QuestionId;
      questionVersionId: QuestionVersionId;
      questionType: string;
      timingProfileId?: string;
      playbackProfileId?: string;
      scoringProfileId?: string;
      serverDeadline?: string;
    },
    tx?: DatabaseClient,
  ): Promise<QuestionSession> {
    const q = tx || this.connection;
    const now = new Date().toISOString();
    const result = await getPool(q).query(
      `INSERT INTO question_sessions (
        id, user_id, question_id, question_version_id, question_type, mode, state,
        timing_profile_id, playback_profile_id, scoring_profile_id, server_deadline,
        started_at, paused_at, submitted_at, expired_at, abandoned_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
      RETURNING *`,
      [
        session.id,
        session.userId,
        session.questionId,
        session.questionVersionId,
        session.questionType,
        session.mode,
        session.state,
        session.timingProfileId || null,
        session.playbackProfileId || null,
        session.scoringProfileId || null,
        session.serverDeadline || null,
        session.startedAt || null,
        session.pausedAt || null,
        session.submittedAt || null,
        session.expiredAt || null,
        session.abandonedAt || null,
        now,
      ],
    );
    return this.mapSessionRow(result.rows[0]);
  }

  public async getSession(id: QuestionSessionId, tx?: DatabaseClient): Promise<QuestionSession | null> {
    const q = tx || this.connection;
    const result = await getPool(q).query(`SELECT * FROM question_sessions WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return this.mapSessionRow(result.rows[0]);
  }

  public async updateSession(session: QuestionSession, tx?: DatabaseClient): Promise<void> {
    const q = tx || this.connection;
    const now = new Date().toISOString();
    await getPool(q).query(
      `UPDATE question_sessions
       SET state = $1, started_at = $2, paused_at = $3, submitted_at = $4,
           expired_at = $5, abandoned_at = $6, updated_at = $7
       WHERE id = $8`,
      [
        session.state,
        session.startedAt || null,
        session.pausedAt || null,
        session.submittedAt || null,
        session.expiredAt || null,
        session.abandonedAt || null,
        now,
        session.id,
      ],
    );
  }

  public async saveResponse(envelope: QuestionResponseEnvelope, tx?: DatabaseClient): Promise<void> {
    const q = tx || this.connection;
    const now = new Date().toISOString();
    await getPool(q).query(
      `INSERT INTO question_session_responses (id, session_id, revision, response_state, response_payload, question_version_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       ON CONFLICT (session_id, revision) DO UPDATE
       SET response_state = EXCLUDED.response_state, response_payload = EXCLUDED.response_payload, updated_at = EXCLUDED.updated_at`,
      [
        `${envelope.sessionId}_rev_${envelope.revision}`,
        envelope.sessionId,
        envelope.revision,
        envelope.state,
        JSON.stringify(envelope.response),
        envelope.questionVersionId,
        now,
      ],
    );
  }

  public async getLatestResponse(
    sessionId: QuestionSessionId,
    tx?: DatabaseClient,
  ): Promise<QuestionResponseEnvelope | null> {
    const q = tx || this.connection;
    const result = await getPool(q).query(
      `SELECT * FROM question_session_responses WHERE session_id = $1 ORDER BY revision DESC LIMIT 1`,
      [sessionId],
    );
    if (result.rows.length === 0) return null;
    return this.mapResponseRow(result.rows[0]);
  }

  public async createSubmission(
    submission: SubmissionResult,
    responsePayload: unknown,
    responseRevision: number,
    requestFingerprint: string,
    tx?: DatabaseClient,
  ): Promise<void> {
    const q = tx || this.connection;
    await getPool(q).query(
      `INSERT INTO question_session_submissions (id, session_id, question_version_id, response_revision, response_payload, idempotency_key, request_fingerprint, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        submission.submissionId,
        submission.sessionId,
        submission.questionVersionId,
        responseRevision,
        JSON.stringify(responsePayload),
        submission.idempotencyKey,
        requestFingerprint,
        submission.submittedAt,
      ],
    );
  }

  public async getSubmission(sessionId: QuestionSessionId, tx?: DatabaseClient): Promise<SubmissionResult | null> {
    const q = tx || this.connection;
    const result = await getPool(q).query(`SELECT * FROM question_session_submissions WHERE session_id = $1`, [
      sessionId,
    ]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      submissionId: row.id as QuestionSubmissionId,
      sessionId: row.session_id as QuestionSessionId,
      questionVersionId: row.question_version_id as QuestionVersionId,
      status: 'accepted', // effectively accepted if persisted
      idempotencyKey: row.idempotency_key as IdempotencyKey,
      submittedAt: row.submitted_at,
    };
  }

  public async insertEvent(event: QuestionSessionEvent, tx?: DatabaseClient): Promise<void> {
    const q = tx || this.connection;
    await getPool(q).query(
      `INSERT INTO question_session_events (id, session_id, sequence, event_type, event_payload, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [event.id, event.sessionId, event.sequence, event.type, JSON.stringify(event.payload), event.occurredAt],
    );
  }

  public async getEvents(sessionId: QuestionSessionId, tx?: DatabaseClient): Promise<QuestionSessionEvent[]> {
    const q = tx || this.connection;
    const result = await getPool(q).query(
      `SELECT * FROM question_session_events WHERE session_id = $1 ORDER BY sequence ASC`,
      [sessionId],
    );
    return result.rows.map((row) => ({
      id: row.id as QuestionEventId,
      sessionId: row.session_id as QuestionSessionId,
      sequence: row.sequence as EventSequence,
      type: row.event_type as QuestionProgressEventType,
      payload: JSON.parse(row.event_payload),
      occurredAt: row.occurred_at,
    }));
  }

  public async savePlaybackRight(right: PlaybackRight, tx?: DatabaseClient): Promise<void> {
    const q = tx || this.connection;
    const now = new Date().toISOString();
    await getPool(q).query(
      `INSERT INTO question_playback_rights (id, session_id, playback_profile_id, allowed_plays, consumed_plays, state, started_at, consumed_at, completed_at, failure_state, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE
       SET consumed_plays = EXCLUDED.consumed_plays, state = EXCLUDED.state, started_at = EXCLUDED.started_at,
           consumed_at = EXCLUDED.consumed_at, completed_at = EXCLUDED.completed_at, failure_state = EXCLUDED.failure_state, updated_at = EXCLUDED.updated_at`,
      [
        right.id,
        right.id, // using session_id as the ID for simple 1-to-1 matching, since reconnects shouldn't create new playback rights
        right.playbackProfileId,
        right.allowedPlays,
        right.consumedPlays,
        right.state,
        right.startedAt || null,
        right.consumedAt || null,
        right.completedAt || null,
        right.failureState || null,
        now,
      ],
    );
  }

  public async getPlaybackRight(sessionId: QuestionSessionId, tx?: DatabaseClient): Promise<PlaybackRight | null> {
    const q = tx || this.connection;
    const result = await getPool(q).query(`SELECT * FROM question_playback_rights WHERE session_id = $1`, [sessionId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as PlaybackRightId,
      playbackProfileId: row.playback_profile_id as PlaybackProfileId,
      allowedPlays: row.allowed_plays,
      consumedPlays: row.consumed_plays,
      state: row.state as PlaybackState,
      startedAt: row.started_at || undefined,
      consumedAt: row.consumed_at || undefined,
      completedAt: row.completed_at || undefined,
      failureState: row.failure_state || undefined,
    };
  }

  public async createIdempotencyRecord(record: IdempotencyRecord, tx?: DatabaseClient): Promise<void> {
    const q = tx || this.connection;
    await getPool(q).query(
      `INSERT INTO question_idempotency_records (id, session_id, idempotency_key, request_fingerprint, result_payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        record.id,
        record.sessionId,
        record.idempotencyKey,
        record.requestFingerprint,
        record.resultPayload,
        record.createdAt,
      ],
    );
  }

  public async findIdempotencyRecord(
    sessionId: QuestionSessionId,
    key: IdempotencyKey,
    tx?: DatabaseClient,
  ): Promise<IdempotencyRecord | null> {
    const q = tx || this.connection;
    const result = await getPool(q).query(
      `SELECT * FROM question_idempotency_records WHERE session_id = $1 AND idempotency_key = $2`,
      [sessionId, key],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      sessionId: row.session_id as QuestionSessionId,
      idempotencyKey: row.idempotency_key as IdempotencyKey,
      requestFingerprint: row.request_fingerprint,
      resultPayload: row.result_payload,
      createdAt: row.created_at,
    };
  }

  private mapSessionRow(row: Record<string, unknown>): QuestionSession {
    return {
      id: row.id as QuestionSessionId,
      mode: row.mode as QuestionSessionMode,
      state: row.state as SessionState,
      createdAt: row.created_at as string,
      startedAt: (row.started_at as string) || undefined,
      pausedAt: (row.paused_at as string) || undefined,
      submittedAt: (row.submitted_at as string) || undefined,
      expiredAt: (row.expired_at as string) || undefined,
      abandonedAt: (row.abandoned_at as string) || undefined,
      updatedAt: row.updated_at as string,
    };
  }

  private mapResponseRow(row: Record<string, unknown>): QuestionResponseEnvelope {
    return {
      sessionId: row.session_id as QuestionSessionId,
      questionVersionId: row.question_version_id as QuestionVersionId,
      questionType: (row.question_type as string) || '',
      revision: row.revision as ResponseRevision,
      state: row.response_state as ResponseState,
      response: JSON.parse(row.response_payload as string),
      updatedAt: row.updated_at as string,
    };
  }
}
