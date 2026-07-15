/**
 * Diagnostic session — tracks a running diagnostic test.
 */
export interface DiagnosticSession {
  id: string;
  userId: string;
  blueprintId: string;
  blueprintVersion: number;
  state: 'created' | 'active' | 'completed' | 'partial' | 'expired';
  selectedQuestions: SelectedQuestion[];
  completedTasks: number;
  totalTasks: number;
  startedAt: string;
  completedAt?: string;
  partialResultId?: string;
}

export interface SelectedQuestion {
  questionId: string;
  questionVersionId: string;
  taskType: string;
  section: string;
  difficulty: number;
  position: number;
}
