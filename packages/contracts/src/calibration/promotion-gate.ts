export interface PromotionGateResult {
  profileId: string;
  profileVersion: number;
  datasetExists: boolean;
  minimumSamplesPass: boolean;
  agreementPass: boolean;
  biasPass: boolean;
  biasDisclosureApproved: boolean;
  driftPass: boolean;
  reportApproved: boolean;
  rollbackCriteriaDefined: boolean;
  auditEventCreated: boolean;
  passed: boolean;
  failures: string[];
}
