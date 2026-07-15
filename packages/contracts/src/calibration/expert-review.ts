export interface ExpertReview {
  id: string;
  sampleId: string;
  reviewerId: string;
  traitScores: Record<string, number>;
  overallScore: number;
  confidence: number;
  notes?: string;
  status: 'draft' | 'submitted' | 'adjudicated';
  createdAt: string;
}
