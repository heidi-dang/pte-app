type IncidentStatus = 'detected' | 'investigating' | 'mitigating' | 'resolved' | 'post-mortem';

const transitions: Record<IncidentStatus, IncidentStatus[]> = {
  detected: ['investigating'],
  investigating: ['mitigating', 'resolved'],
  mitigating: ['resolved', 'investigating'],
  resolved: ['post-mortem'],
  'post-mortem': [],
};

export function canTransitionIncident(from: IncidentStatus, to: IncidentStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}
