export interface AttemptHistoryFilter {
  taskTypes?: string[];
  skills?: string[];
  dateRange?: { start: string; end: string };
  mode?: string;
  resultState?: 'any' | 'completed' | 'partial' | 'failed';
  limit: number;
  offset: number;
}

export interface AttemptHistoryEntry {
  attemptId: string;
  questionVersionId: string;
  taskType: string;
  section: string;
  mode: string;
  submittedAt: string;
  estimatedScore: number;
  classification: string;
  resultState: string;
  responseAvailable: boolean;
  mediaAvailable: boolean;
  feedbackAvailable: boolean;
  scoringProfileVersion: number;
}

export interface AttemptHistoryResult {
  entries: AttemptHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}
