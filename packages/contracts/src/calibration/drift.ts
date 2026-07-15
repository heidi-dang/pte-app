export interface DriftEvent {
  id: string;
  baselineProfileId: string;
  baselineVersion: number;
  candidateProfileId: string;
  candidateVersion: number;
  metricWindow: string;
  thresholdProfile: string;
  sampleSource: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: Record<string, number>;
  status: 'detected' | 'investigating' | 'resolved' | 'accepted';
  alertSent: boolean;
  resolvedAt?: string;
  resolution?: string;
}
