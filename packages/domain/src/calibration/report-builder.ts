import type { CalibrationReport } from '@pte-app/contracts';

export function buildCalibrationReport(datasetId: string, profileIds: string[]): CalibrationReport {
  return {
    id: crypto.randomUUID(),
    version: 1,
    datasetId,
    profileIds,
    metricResults: [],
    failures: [],
    disclosures: [],
    immutable: false,
    createdAt: new Date().toISOString(),
  };
}

export function finalizeReport(report: CalibrationReport): CalibrationReport {
  return { ...report, immutable: true };
}
