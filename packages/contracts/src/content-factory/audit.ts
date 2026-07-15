export interface ContentAuditEntry {
  id: string;
  contentId: string;
  action: string;
  actorId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  timestamp: string;
}
