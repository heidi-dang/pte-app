/**
 * Question Engine — core types for all 22 PTE task types
 */

export type QuestionMode = 'learning' | 'timed_practice' | 'section_test' | 'full_mock';

export type SessionStatus = 'pending' | 'active' | 'paused' | 'completed' | 'timed_out' | 'submitted';

export type PlaybackState = 'not_started' | 'playing' | 'paused' | 'consumed';

export interface QuestionSession {
  readonly id: string;
  readonly userId: string;
  readonly contentId: string;
  readonly taskType: string;
  readonly mode: QuestionMode;
  readonly status: SessionStatus;
  readonly startedAt: string;
  readonly deadline?: string;
  readonly pausedAt?: string;
  readonly totalPausedMs: number;
  readonly response: Record<string, unknown>;
  readonly responseAutoSavedAt?: string;
  readonly submittedAt?: string;
  readonly playbackState: PlaybackState;
  readonly playbackRemainingMs: number;
  readonly preparationMs: number;
}

export interface QuestionTimer {
  readonly deadline: string;
  readonly remainingMs: number;
  readonly isPaused: boolean;
}

export interface SubmissionResult {
  readonly accepted: boolean;
  readonly duplicate: boolean;
  readonly sessionId: string;
  readonly timestamp: string;
}

export interface RendererPlugin {
  readonly taskType: string;
  readonly render: (prompt: Record<string, unknown>, mode: QuestionMode) => Promise<RendererOutput>;
  readonly validateResponse: (response: unknown) => boolean;
  readonly estimatedSeconds: number;
}

export interface RendererOutput {
  readonly blocks: RenderBlock[];
  readonly instructions: string;
  readonly estimatedSeconds: number;
}

export interface RenderBlock {
  readonly type: 'text' | 'audio' | 'image' | 'video' | 'input' | 'options' | 'blank' | 'recording';
  readonly id: string;
  readonly data: Record<string, unknown>;
}
