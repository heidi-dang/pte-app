export interface StudyPlanEffectivenessResult {
  id: string;
  planVersion: number;
  assignedActivities: number;
  completedActivities: number;
  beforeScore: number;
  afterScore: number;
  comparableProfile: boolean;
  attrition: number;
  missingData: boolean;
  classification: 'observational' | 'controlled' | 'inconclusive';
  createdAt: string;
}
