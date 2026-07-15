import type {
  QuestionSession,
  QuestionResponseEnvelope,
  SubmissionResult,
  PlaybackRight,
  QuestionSessionMode,
  ResponseState,
  QuestionSessionId,
  QuestionVersionId,
  IdempotencyKey
} from '@pte-app/contracts';

export class QuestionSessionClient {
  constructor(private readonly baseUrl: string) {}

  public async startSession(
    questionId: string,
    versionId: string,
    mode: QuestionSessionMode,
    config?: {
      durationMs?: number;
      timingProfileId?: string;
      playbackProfileId?: string;
      scoringProfileId?: string;
    }
  ): Promise<QuestionSession> {
    const res = await fetch(`${this.baseUrl}/question-sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, versionId, mode, ...config }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  public async getSession(sessionId: QuestionSessionId): Promise<QuestionSession> {
    const res = await fetch(`${this.baseUrl}/question-sessions/${sessionId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  public async saveResponse(
    sessionId: QuestionSessionId,
    questionVersionId: QuestionVersionId,
    response: unknown,
    state: ResponseState,
    revision: number
  ): Promise<QuestionResponseEnvelope> {
    const res = await fetch(`${this.baseUrl}/question-sessions/${sessionId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionVersionId, response, state, revision }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  public async requestPlayback(sessionId: QuestionSessionId): Promise<PlaybackRight> {
    const res = await fetch(`${this.baseUrl}/question-sessions/${sessionId}/playback`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  public async submitSession(
    sessionId: QuestionSessionId,
    idempotencyKey: IdempotencyKey,
    requestFingerprint: string
  ): Promise<SubmissionResult> {
    const res = await fetch(`${this.baseUrl}/question-sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey, requestFingerprint }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  public async getReview(
    sessionId: QuestionSessionId
  ): Promise<{
    session: QuestionSession;
    response: QuestionResponseEnvelope | null;
    submission: SubmissionResult | null;
    correctAnswers: unknown;
  }> {
    const res = await fetch(`${this.baseUrl}/question-sessions/${sessionId}/review`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}
