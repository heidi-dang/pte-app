export interface Incident {
  id: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'detected' | 'investigating' | 'mitigating' | 'resolved' | 'post-mortem';
  affectedCapability: string;
  startedAt: string;
  identifiedAt?: string;
  resolvedAt?: string;
  userFacingUpdates: Array<{ message: string; timestamp: string; locale: string }>;
  internalUpdates: Array<{ message: string; timestamp: string }>;
  impactSummary?: string;
  remediation?: string;
  postIncidentReference?: string;
}
