/**
 * Mock exam session — stores all state for a mock exam.
 */
export interface MockSession {
  id: string;
  userId: string;
  blueprintId: string;
  blueprintVersion: number;
  /** Absolute server deadline — browser closure does not pause. */
  serverDeadline: string;
  /** Current section. */
  currentSection: string;
  /** Current task position. */
  currentTaskPosition: number;
  /** Selected immutable question versions. */
  selectedQuestions: MockSelectedQuestion[];
  /** Response/session references. */
  responses: MockResponseRef[];
  /** Playback state per section. */
  playbackState: Record<string, MockPlaybackState>;
  /** Recording state per section. */
  recordingState: Record<string, MockRecordingState>;
  /** Progress. */
  progress: MockProgress;
  /** Submission state. */
  submissionState: MockSubmissionState;
  /** Scoring workflow state. */
  scoringWorkflow: MockScoringWorkflow;
  /** Result reference. */
  resultId?: string;
  state: MockSessionState;
  createdAt: string;
  startedAt?: string;
  submittedAt?: string;
  expiredAt?: string;
}

export type MockSessionState =
  | 'created'
  | 'ready'
  | 'active'
  | 'section-transition'
  | 'submitting'
  | 'submitted'
  | 'scoring-queued'
  | 'scoring'
  | 'result-building'
  | 'completed'
  | 'expired'
  | 'failed-recoverable'
  | 'failed-terminal'
  | 'abandoned';

export interface MockSelectedQuestion {
  questionId: string;
  questionVersionId: string;
  taskType: string;
  section: string;
  position: number;
}

export interface MockResponseRef {
  questionVersionId: string;
  sessionQuestionId: string;
  responseId: string;
  revision: number;
}

export interface MockPlaybackState {
  consumedPlays: number;
  allowedPlays: number;
}

export interface MockRecordingState {
  recordingId?: string;
  state: string;
}

export interface MockProgress {
  completedTasks: number;
  totalTasks: number;
  currentSectionTasks: number;
  totalSectionTasks: number;
}

export interface MockSubmissionState {
  submitted: boolean;
  idempotencyKey?: string;
  submittedAt?: string;
}

export interface MockScoringWorkflow {
  state: 'idle' | 'queued' | 'scoring' | 'completed' | 'failed';
  jobId?: string;
  startedAt?: string;
  completedAt?: string;
}
