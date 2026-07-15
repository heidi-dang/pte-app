import type { PromotionGateResult } from '@pte-app/contracts';

export function evaluatePromotionGate(checks: Partial<PromotionGateResult>): PromotionGateResult {
  const failures: string[] = [];

  if (!checks.datasetExists) failures.push('Required calibration dataset does not exist');
  if (!checks.minimumSamplesPass) failures.push('Minimum sample requirements not met');
  if (!checks.agreementPass) failures.push('Agreement thresholds not met');
  if (!checks.biasPass && !checks.biasDisclosureApproved)
    failures.push('Bias checks failed and no approved disclosure');
  if (!checks.driftPass) failures.push('Drift checks failed');
  if (!checks.reportApproved) failures.push('Calibration report not approved');
  if (!checks.rollbackCriteriaDefined) failures.push('Rollback criteria not defined');
  if (!checks.auditEventCreated) failures.push('Audit event not created');

  return {
    profileId: checks.profileId ?? '',
    profileVersion: checks.profileVersion ?? 0,
    datasetExists: checks.datasetExists ?? false,
    minimumSamplesPass: checks.minimumSamplesPass ?? false,
    agreementPass: checks.agreementPass ?? false,
    biasPass: checks.biasPass ?? false,
    biasDisclosureApproved: checks.biasDisclosureApproved ?? false,
    driftPass: checks.driftPass ?? false,
    reportApproved: checks.reportApproved ?? false,
    rollbackCriteriaDefined: checks.rollbackCriteriaDefined ?? false,
    auditEventCreated: checks.auditEventCreated ?? false,
    passed: failures.length === 0,
    failures,
  };
}
