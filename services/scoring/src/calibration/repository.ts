import type { CalibrationReport, CalibrationDataset } from '@pte-app/contracts';

export interface CalibrationRepository {
  findAllDatasets(): Promise<Array<{ id: string; taskType: string; activationStatus: string }>>;
  findDatasetForProfile(profileId: string): Promise<CalibrationDataset | null>;
  findReportByDataset(datasetId: string): Promise<CalibrationReport | null>;
}
