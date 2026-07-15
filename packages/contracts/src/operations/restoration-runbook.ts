export interface RestorationRunbook {
  id: string;
  version: number;
  environmentClass: string;
  prerequisites: string[];
  validationSteps: Array<{ step: number; description: string; command?: string }>;
  rollbackSteps: Array<{ step: number; description: string }>;
  evidenceRequirements: string[];
  approvalStatus: 'draft' | 'approved' | 'superseded';
  lastTestedAt?: string;
  testOutcome?: 'passed' | 'failed';
  createdAt: string;
}
