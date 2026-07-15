export interface AuditQuery {
  filters: {
    actorIds?: string[];
    actionTypes?: string[];
    dateRange?: { start: string; end: string };
    resourceTypes?: string[];
  };
  limit: number;
  offset: number;
}

export interface AuditViewEntry {
  id: string;
  actionType: string;
  actorId: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  timestamp: string;
}
