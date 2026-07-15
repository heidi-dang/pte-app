import { z } from 'zod';
export const PromotionGateResultSchema = z.object({
  profileId: z.string(),
  profileVersion: z.number().int(),
  datasetExists: z.boolean(),
  minimumSamplesPass: z.boolean(),
  agreementPass: z.boolean(),
  biasPass: z.boolean(),
  biasDisclosureApproved: z.boolean(),
  driftPass: z.boolean(),
  reportApproved: z.boolean(),
  rollbackCriteriaDefined: z.boolean(),
  auditEventCreated: z.boolean(),
  passed: z.boolean(),
  failures: z.array(z.string()),
});
