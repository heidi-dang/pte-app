/**
 * Question Session Engine
 *
 * Manages question lifecycle across all modes:
 * - Session creation, pause, resume, submit
 * - Server-authoritative deadlines
 * - Autosave
 * - Playback-right tracking
 * - Duplicate submission prevention
 * - Interruption recovery
 */

import type {
  QuestionSession,
  QuestionMode,
  SessionStatus,
  QuestionTimer,
  SubmissionResult,
  PlaybackState,
} from './types.js';

export class SessionEngine {
  constructor(private readonly sessionStore: Map<string, QuestionSession>) {}

  async createSession(
    userId: string,
    contentId: string,
    taskType: string,
    mode: QuestionMode,
    timeLimitSeconds?: number,
    preparationSeconds?: number,
  ): Promise<QuestionSession> {
    const id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date();
    const deadline = timeLimitSeconds ? new Date(now.getTime() + timeLimitSeconds * 1000).toISOString() : undefined;

    const session: QuestionSession = {
      id,
      userId,
      contentId,
      taskType,
      mode,
      status: 'active',
      startedAt: now.toISOString(),
      deadline,
      totalPausedMs: 0,
      response: {},
      playbackState: 'not_started',
      playbackRemainingMs: this.getMaxPlaybackMs(taskType),
      preparationMs: preparationSeconds ?? 0,
    };

    this.sessionStore.set(id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<QuestionSession | null> {
    return this.sessionStore.get(sessionId) ?? null;
  }

  async restoreSession(sessionId: string): Promise<QuestionSession | null> {
    const session = this.sessionStore.get(sessionId);
    if (!session) return null;

    // Restore from paused/interrupted state
    if (session.status === 'paused' || session.status === 'active') {
      const pausedMs = session.pausedAt ? Date.now() - new Date(session.pausedAt).getTime() : 0;
      const updated: QuestionSession = {
        ...session,
        status: 'active',
        totalPausedMs: session.totalPausedMs + pausedMs,
        pausedAt: undefined,
      };
      this.sessionStore.set(sessionId, updated);
      return updated;
    }

    return session;
  }

  async saveResponse(sessionId: string, response: Record<string, unknown>): Promise<QuestionSession | null> {
    const session = this.sessionStore.get(sessionId);
    if (!session || (session.status !== 'active' && session.status !== 'paused')) return null;

    const updated: QuestionSession = {
      ...session,
      response: { ...session.response, ...response },
      responseAutoSavedAt: new Date().toISOString(),
    };
    this.sessionStore.set(sessionId, updated);
    return updated;
  }

  async submitSession(sessionId: string): Promise<SubmissionResult> {
    const session = this.sessionStore.get(sessionId);
    if (!session) {
      return { accepted: false, duplicate: false, sessionId, timestamp: new Date().toISOString() };
    }

    if (session.status === 'submitted' || session.status === 'completed') {
      return { accepted: false, duplicate: true, sessionId, timestamp: new Date().toISOString() };
    }

    const updated: QuestionSession = {
      ...session,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    this.sessionStore.set(sessionId, updated);

    return { accepted: true, duplicate: false, sessionId, timestamp: updated.submittedAt! };
  }

  async getTimer(sessionId: string): Promise<QuestionTimer | null> {
    const session = this.sessionStore.get(sessionId);
    if (!session || !session.deadline) return null;

    const deadlineMs = new Date(session.deadline).getTime();
    const now = Date.now();
    const pausedAdjustment = session.pausedAt ? Date.now() - new Date(session.pausedAt).getTime() : 0;
    const effectiveNow = now - pausedAdjustment - session.totalPausedMs;
    const remainingMs = Math.max(0, deadlineMs - effectiveNow);

    return {
      deadline: session.deadline,
      remainingMs,
      isPaused: session.status === 'paused',
    };
  }

  async consumePlayback(sessionId: string): Promise<QuestionSession | null> {
    const session = this.sessionStore.get(sessionId);
    if (!session || session.playbackState === 'consumed') return null;

    const updated: QuestionSession = {
      ...session,
      playbackState: 'consumed',
      playbackRemainingMs: 0,
    };
    this.sessionStore.set(sessionId, updated);
    return updated;
  }

  private getMaxPlaybackMs(taskType: string): number {
    // Task-specific playback limits (approximate)
    const limits: Record<string, number> = {
      summarize_spoken_text: 90000, // 90s
      multiple_choice_multiple: 45000,
      highlight_correct_summary: 45000,
      multiple_choice_single: 45000,
      select_missing_word: 30000,
      highlight_incorrect_words: 45000,
      write_from_dictation: 45000,
      repeat_sentence: 15000,
      retell_lecture: 90000,
    };
    return limits[taskType] ?? 60000;
  }
}
