/**
 * Content Provenance and Licence Register types
 */

export type ContentSource = 'original' | 'licensed' | 'generated' | 'imported' | 'student_submitted';

export type ReviewStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'retired';

export interface LicenceRecord {
  readonly id: string;
  readonly licenceType: 'creative_commons' | 'commercial' | 'educational' | 'exclusive' | 'custom';
  readonly holder: string;
  readonly grantedAt: string;
  readonly expiresAt?: string;
  readonly restrictions: string[];
  readonly attributionRequired: boolean;
  readonly sourceUrl?: string;
  readonly evidenceFile?: string;
}

export interface ProvenanceEntry {
  readonly contentId: string;
  readonly version: number;
  readonly source: ContentSource;
  readonly authorId: string;
  readonly licenceRef?: string;
  readonly attribution?: string;
  readonly reviewedById?: string;
  readonly reviewedAt?: string;
  readonly reviewNotes?: string;
  readonly similarityHash?: string;
  readonly sourceFile?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly action: 'create' | 'update' | 'approve' | 'reject' | 'publish' | 'retire' | 'import' | 'verify';
  readonly entityType: 'content' | 'licence' | 'user' | 'scoring_profile';
  readonly entityId: string;
  readonly actorId: string;
  readonly details: Record<string, unknown>;
  readonly timestamp: string;
}

export interface SimilarityCheck {
  readonly contentId: string;
  readonly similarTo: string[];
  readonly score: number;
  readonly checkedAt: string;
}
