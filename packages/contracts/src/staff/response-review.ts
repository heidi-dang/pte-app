export interface ResponseReview {
  id: string;
  attemptId: string;
  questionVersionId: string;
  responseType: 'text' | 'media' | 'both';
  responseReference: string;
  score: number;
  evaluationEvidence: Array<{ ruleType: string; contribution: number }>;
  teacherReviewStatus: 'pending' | 'in-review' | 'reviewed' | 'disputed';
  lockOwnerId?: string;
  lockExpiresAt?: string;
  reviewHistory: Array<{ action: string; timestamp: string; reviewerId: string }>;
  createdAt: string;
  updatedAt: string;
}
