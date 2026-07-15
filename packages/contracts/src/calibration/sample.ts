export interface CalibrationSample {
  id: string;
  datasetId: string;
  responseReference: string;
  questionVersionId: string;
  expectedTraitEvidence: Array<{ traitId: string; expectedRange: [number, number] }>;
  expectedResultRange: [number, number];
  expertIdentities: string[];
  agreementStatus: 'pending' | 'agreed' | 'disputed' | 'adjudicated';
  confidence: number;
  provenance: string;
}
