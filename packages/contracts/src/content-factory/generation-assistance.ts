export interface GenerationAssistanceRequest {
  id: string;
  draftId: string;
  providerId: string;
  providerConfigurationId: string;
  prompt: string;
  referenceProvenance?: string;
  generatedSections: string[];
  humanReviewRequired: boolean;
  status: 'requested' | 'processing' | 'completed' | 'failed';
  outputReference?: string;
  createdAt: string;
  completedAt?: string;
}
