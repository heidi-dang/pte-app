export interface TeacherFeedback {
  id: string;
  attemptId: string;
  teacherId: string;
  writtenFeedback?: string;
  audioFeedbackMediaId?: string;
  status: 'draft' | 'submitted' | 'revised' | 'withdrawn';
  version: number;
  versionHistory: Array<{ version: number; content: string; updatedAt: string }>;
  author: string;
  studentVisible: boolean;
  createdAt: string;
  updatedAt: string;
}
