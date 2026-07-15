import type { ActivityId } from './identifiers.js';

export type ActivityType =
  | 'attempt-completed'
  | 'scoring-completed'
  | 'evaluation-completed'
  | 'diagnostic-completed'
  | 'study-plan-updated'
  | 'mock-completed'
  | 'report-generated'
  | 'feedback-received';

export interface ActivityItem {
  id: ActivityId;
  userId: string;
  activityType: ActivityType;
  description: string;
  resultId?: string;
  attemptId?: string;
  questionVersionId?: string;
  taskType?: string;
  estimatedScore?: number;
  classification?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
