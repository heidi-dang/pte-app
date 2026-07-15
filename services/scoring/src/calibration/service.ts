import type { PromotionGateResult, CalibrationReport } from '@pte-app/contracts';
import type { CalibrationRepository } from './repository.js';
import { evaluatePromotionGate } from '@pte-app/domain';

export class CalibrationService {
  constructor(private repo: CalibrationRepository) {}

  async listDatasets(): Promise<Array<{ id: string; taskType: string; activationStatus: string }>> {
    return this.repo.findAllDatasets();
  }

  async evaluatePromotion(
    profileId: string,
    profileVersion: number,
    checks: Partial<PromotionGateResult>[],
  ): Promise<PromotionGateResult> {
    const dataset = await this.repo.findDatasetForProfile(profileId);
    return evaluatePromotionGate({
      profileId,
      profileVersion,
      datasetExists: !!dataset,
      minimumSamplesPass: (dataset?.sampleReferences.length ?? 0) >= 5,
      agreementPass: checks[0]?.agreementPass ?? false,
      biasPass: checks[0]?.biasPass ?? false,
      driftPass: checks[0]?.driftPass ?? false,
      reportApproved: checks[0]?.reportApproved ?? false,
      rollbackCriteriaDefined: checks[0]?.rollbackCriteriaDefined ?? false,
      auditEventCreated: checks[0]?.auditEventCreated ?? true,
    });
  }

  async getReport(datasetId: string): Promise<CalibrationReport | null> {
    return this.repo.findReportByDataset(datasetId);
  }
}
