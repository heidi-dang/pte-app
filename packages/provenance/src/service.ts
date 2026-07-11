/**
 * Provenance Service
 *
 * Manages content provenance tracking, licence records, review workflow
 * and audit trail for all published and draft content.
 */

import type {
  LicenceRecord,
  ProvenanceEntry,
  AuditEvent,
  ContentSource,
  ReviewStatus,
  SimilarityCheck,
} from './types.js';

export class ProvenanceService {
  private readonly auditLog: AuditEvent[] = [];

  constructor(
    private readonly provenanceStore: Map<string, ProvenanceEntry>,
    private readonly licenceStore: Map<string, LicenceRecord>,
  ) {}

  // --- Provenance ---

  async recordProvenance(entry: ProvenanceEntry): Promise<ProvenanceEntry> {
    this.provenanceStore.set(entry.contentId, entry);
    this.recordAudit({
      action: entry.version === 1 ? 'create' : 'update',
      entityType: 'content',
      entityId: entry.contentId,
      actorId: entry.authorId,
      details: { source: entry.source, version: entry.version },
    });
    return entry;
  }

  async getProvenance(contentId: string): Promise<ProvenanceEntry | null> {
    return this.provenanceStore.get(contentId) ?? null;
  }

  async updateReviewStatus(
    contentId: string,
    status: ReviewStatus,
    reviewerId: string,
    notes?: string,
  ): Promise<ProvenanceEntry | null> {
    const entry = this.provenanceStore.get(contentId);
    if (!entry) return null;

    const updated: ProvenanceEntry = {
      ...entry,
      reviewedById: reviewerId,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes,
      updatedAt: new Date().toISOString(),
    };
    this.provenanceStore.set(contentId, updated);

    this.recordAudit({
      action: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'update',
      entityType: 'content',
      entityId: contentId,
      actorId: reviewerId,
      details: { status, notes },
    });

    return updated;
  }

  // --- Licences ---

  async registerLicence(licence: LicenceRecord): Promise<LicenceRecord> {
    this.licenceStore.set(licence.id, licence);
    return licence;
  }

  async getLicence(id: string): Promise<LicenceRecord | null> {
    return this.licenceStore.get(id) ?? null;
  }

  async getExpiringLicences(daysThreshold: number = 30): Promise<LicenceRecord[]> {
    const now = Date.now();
    const threshold = daysThreshold * 86400000;
    return Array.from(this.licenceStore.values()).filter((l) => {
      if (!l.expiresAt) return false;
      const expiry = new Date(l.expiresAt).getTime();
      return expiry > now && expiry - now < threshold;
    });
  }

  // --- Similarity ---

  async checkSimilarity(contentId: string): Promise<SimilarityCheck> {
    const entry = this.provenanceStore.get(contentId);
    if (!entry?.similarityHash) {
      return { contentId, similarTo: [], score: 0, checkedAt: new Date().toISOString() };
    }
    const similar: string[] = [];
    for (const [id, other] of this.provenanceStore) {
      if (id !== contentId && other.similarityHash === entry.similarityHash) {
        similar.push(id);
      }
    }
    return { contentId, similarTo: similar, score: similar.length > 0 ? 1 : 0, checkedAt: new Date().toISOString() };
  }

  // --- Audit ---

  private recordAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    this.auditLog.push({
      ...event,
      id: `aud_${this.auditLog.length + 1}_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    });
  }

  async getAuditLog(entityId?: string): Promise<AuditEvent[]> {
    if (entityId) {
      return this.auditLog.filter((e) => e.entityId === entityId);
    }
    return [...this.auditLog];
  }

  async getAuditReport(): Promise<{ totalEvents: number; byAction: Record<string, number> }> {
    const byAction: Record<string, number> = {};
    for (const event of this.auditLog) {
      byAction[event.action] = (byAction[event.action] || 0) + 1;
    }
    return { totalEvents: this.auditLog.length, byAction };
  }
}
