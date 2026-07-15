export interface DiagnosticQualityResult {
  id: string;
  diagnosticProfileId: string;
  diagnosticProfileVersion: number;
  taskCoverage: Record<string, { predicted: number; observed: number }>;
  falsePositiveWeaknesses: string[];
  falseNegativeWeaknesses: string[];
  confidence: number;
  partialData: boolean;
  createdAt: string;
}
