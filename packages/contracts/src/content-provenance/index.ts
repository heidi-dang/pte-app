export type SourceType =
  | 'original_creation_record'
  | 'contributor_declaration'
  | 'licence_agreement'
  | 'public_domain_record'
  | 'open_licence_source'
  | 'commissioned_work'
  | 'internal_reference'
  | 'authorised_external_reference';

export type OwnershipType =
  | 'platform_original'
  | 'commissioned'
  | 'contributor_owned'
  | 'licensed'
  | 'public_domain'
  | 'open_licence'
  | 'authorised_reference';

export type SourceStatus = 'draft' | 'active' | 'retired' | 'disputed';

export type LicenceStatus = 'draft' | 'pending_review' | 'active' | 'expired' | 'revoked' | 'superseded' | 'rejected';

export type LicenceType = 'exclusive' | 'non_exclusive' | 'open' | 'public_domain' | 'statutory';

export type VerificationStatus =
  'draft' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 're_verification_required';

export type PublicationStatus = 'blocked' | 'eligible' | 'published' | 'retired';

export type EvidenceStatus = 'active' | 'superseded' | 'invalid' | 'retained_for_history';

export type EvidenceType =
  | 'signed_agreement'
  | 'licence_document'
  | 'contributor_declaration'
  | 'original_draft'
  | 'source_screenshot'
  | 'source_archive'
  | 'public_domain_evidence'
  | 'open_licence_evidence'
  | 'attribution_evidence'
  | 'similarity_report';

export type SimilarityProviderId = string & { __brand: 'SimilarityProviderId' };

export type BlockerCode =
  | 'PROVENANCE_MISSING'
  | 'PROVENANCE_UNVERIFIED'
  | 'SOURCE_DISPUTED'
  | 'LICENCE_MISSING'
  | 'LICENCE_EXPIRED'
  | 'LICENCE_REVOKED'
  | 'COMMERCIAL_USE_NOT_ALLOWED'
  | 'MODIFICATION_NOT_ALLOWED'
  | 'ATTRIBUTION_REQUIRED'
  | 'EVIDENCE_MISSING'
  | 'EVIDENCE_INVALID'
  | 'SIMILARITY_CHECK_PENDING'
  | 'SIMILARITY_THRESHOLD_EXCEEDED'
  | 'PROHIBITED_CONTENT_MATCH'
  | 'CONTENT_VERSION_CHANGED'
  | 'REVERIFICATION_REQUIRED'
  | 'POLICY_VERSION_MISSING';

export type AuditEventType =
  | 'source_created'
  | 'source_updated'
  | 'source_retired'
  | 'source_disputed'
  | 'licence_created'
  | 'licence_updated'
  | 'licence_superseded'
  | 'licence_revoked'
  | 'evidence_attached'
  | 'evidence_invalidated'
  | 'provenance_created'
  | 'provenance_updated'
  | 'provenance_submitted'
  | 'provenance_review_started'
  | 'provenance_verified'
  | 'provenance_rejected'
  | 'similarity_requested'
  | 'similarity_completed'
  | 'similarity_failed'
  | 'publication_allowed'
  | 'publication_blocked'
  | 'reverification_created'
  | 'reverification_completed'
  | 'report_generated';

export type SourceTransition = 'create' | 'activate' | 'retire' | 'dispute';

export type LicenceTransition = 'create' | 'activate' | 'supersede' | 'revoke' | 'expire';

export type ProvenanceTransition =
  'create' | 'update' | 'submit' | 'start_review' | 'verify' | 'reject' | 'require_re_verification';

export type ContentId = string & { __brand: 'ContentId' };
export type ContentVersionId = string & { __brand: 'ContentVersionId' };
export type SourceId = string & { __brand: 'SourceId' };
export type LicenceId = string & { __brand: 'LicenceId' };
export type EvidenceId = string & { __brand: 'EvidenceId' };
export type ProvenanceId = string & { __brand: 'ProvenanceId' };
export type SimilarityCheckId = string & { __brand: 'SimilarityCheckId' };
export type PolicyId = string & { __brand: 'PolicyId' };
export type PolicyVersion = string & { __brand: 'PolicyVersion' };
export type ReVerificationJobId = string & { __brand: 'ReVerificationJobId' };
export type PublicationDecisionId = string & { __brand: 'PublicationDecisionId' };
export type ProhibitedMatchId = string & { __brand: 'ProhibitedMatchId' };
export type AuditEventId = string & { __brand: 'AuditEventId' };
export type UserId = string & { __brand: 'UserId' };
export type MediaId = string & { __brand: 'MediaId' };
export type RequestId = string & { __brand: 'RequestId' };

export interface SourceRecord {
  readonly id: SourceId;
  readonly sourceType: SourceType;
  readonly title: string;
  readonly owner: string;
  readonly publisher: string;
  readonly sourceUrl: string;
  readonly jurisdiction: string;
  readonly sourceDate: string;
  readonly accessDate: string;
  readonly description: string;
  readonly status: SourceStatus;
  readonly evidenceIds: readonly EvidenceId[];
  readonly createdBy: UserId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
}

export interface LicenceRecord {
  readonly id: LicenceId;
  readonly licenceType: LicenceType;
  readonly licensor: string;
  readonly licensee: string;
  readonly rightsGranted: readonly string[];
  readonly prohibitedUses: readonly string[];
  readonly attributionRequired: boolean;
  readonly commercialUseAllowed: boolean;
  readonly modificationAllowed: boolean;
  readonly redistributionAllowed: boolean;
  readonly validFrom: string;
  readonly validUntil: string | null;
  readonly jurisdiction: string;
  readonly evidenceIds: readonly EvidenceId[];
  readonly status: LicenceStatus;
  readonly supersedes: LicenceId | null;
  readonly createdBy: UserId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
}

export interface EvidenceRecord {
  readonly id: EvidenceId;
  readonly evidenceType: EvidenceType;
  readonly fileName: string;
  readonly mediaId: MediaId;
  readonly checksum: string;
  readonly mimeType: string;
  readonly description: string;
  readonly uploadedBy: UserId;
  readonly uploadedAt: string;
  readonly retainedUntil: string;
  readonly status: EvidenceStatus;
}

export interface ProvenanceRecord {
  readonly id: ProvenanceId;
  readonly contentId: ContentId;
  readonly contentVersionId: ContentVersionId;
  readonly sourceId: SourceId;
  readonly licenceId: LicenceId | null;
  readonly ownershipType: OwnershipType;
  readonly verificationStatus: VerificationStatus;
  readonly publicationStatus: PublicationStatus;
  readonly attribution: string;
  readonly evidenceIds: readonly EvidenceId[];
  readonly similarityCheckId: SimilarityCheckId | null;
  readonly createdBy: UserId;
  readonly reviewedBy: UserId | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly verifiedAt: string | null;
  readonly expiresAt: string | null;
  readonly supersedes: ProvenanceId | null;
  readonly version: number;
}

export interface SimilarityCheck {
  readonly id: SimilarityCheckId;
  readonly contentId: ContentId;
  readonly contentVersionId: ContentVersionId;
  readonly providerId: SimilarityProviderId;
  readonly profileVersion: string;
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly similarityScore: number | null;
  readonly matchedSources: readonly string[];
  readonly completedAt: string | null;
  readonly error: string | null;
  readonly evidenceSnapshot: string;
}

export interface PublicationBlocker {
  readonly code: BlockerCode;
  readonly message: string;
}

export interface PublicationEligibilityResult {
  readonly eligible: boolean;
  readonly evaluatedAt: string;
  readonly policyId: PolicyId;
  readonly policyVersion: PolicyVersion;
  readonly blockers: readonly PublicationBlocker[];
  readonly warnings: readonly string[];
  readonly provenanceRecordId: ProvenanceId | null;
  readonly licenceRecordId: LicenceId | null;
  readonly requiredActions: readonly string[];
}

export interface PublicationDecision {
  readonly id: PublicationDecisionId;
  readonly contentId: ContentId;
  readonly contentVersionId: ContentVersionId;
  readonly provenanceRecordId: ProvenanceId;
  readonly policyId: PolicyId;
  readonly policyVersion: PolicyVersion;
  readonly eligible: boolean;
  readonly blockers: readonly PublicationBlocker[];
  readonly warnings: readonly string[];
  readonly actor: UserId;
  readonly requestId: RequestId;
  readonly evaluatedAt: string;
}

export interface ProhibitedRuleMatch {
  readonly id: ProhibitedMatchId;
  readonly contentId: ContentId;
  readonly contentVersionId: ContentVersionId;
  readonly ruleName: string;
  readonly matchedAt: string;
  readonly matchedBy: UserId;
  readonly resolved: boolean;
  readonly resolvedAt: string | null;
  readonly resolvedBy: UserId | null;
  readonly reason: string;
}

export interface ProvenanceAuditEvent {
  readonly id: AuditEventId;
  readonly eventType: AuditEventType;
  readonly actor: UserId;
  readonly requestId: RequestId | null;
  readonly entityType: string;
  readonly entityId: string;
  readonly previousVersion: string | null;
  readonly newVersion: string | null;
  readonly reason: string | null;
  readonly policyId: PolicyId | null;
  readonly policyVersion: PolicyVersion | null;
  readonly result: string | null;
  readonly occurredAt: string;
}

export interface ProvenanceAuditReport {
  readonly generatedAt: string;
  readonly scope: string;
  readonly policyId: PolicyId;
  readonly policyVersion: PolicyVersion;
  readonly totals: Readonly<Record<string, number>>;
  readonly expiringLicences: readonly string[];
  readonly blockedContent: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly pendingReviews: number;
  readonly unverifiableItems: readonly string[];
  readonly historicalChanges: readonly string[];
}

export interface ReVerificationJob {
  readonly id: ReVerificationJobId;
  readonly provenanceId: ProvenanceId;
  readonly reason: string;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly status: 'pending' | 'completed' | 'failed';
  readonly attempt: number;
}

export interface ProvenancePolicy {
  readonly id: PolicyId;
  readonly version: PolicyVersion;
  readonly status: 'draft' | 'active' | 'retired';
  readonly effectiveFrom: string;
  readonly effectiveUntil: string | null;
  readonly similarityReviewThreshold: number;
  readonly similarityBlockThreshold: number;
  readonly expiryWarningDays: number;
  readonly evidenceRetentionDays: number;
  readonly requiredEvidenceByOwnership: Readonly<Record<string, readonly string[]>>;
  readonly prohibitedRules: readonly string[];
  readonly supportedSourceTypes: readonly SourceType[];
  readonly supportedLicenceTypes: readonly LicenceType[];
}

export const VALID_PROVENANCE_TRANSITIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  draft: Object.freeze(['submitted']),
  submitted: Object.freeze(['under_review']),
  under_review: Object.freeze(['verified', 'rejected']),
  verified: Object.freeze(['re_verification_required']),
  rejected: Object.freeze(['draft']),
  re_verification_required: Object.freeze(['under_review']),
});

export const VALID_SOURCE_TRANSITIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  draft: Object.freeze(['active']),
  active: Object.freeze(['retired', 'disputed']),
  retired: Object.freeze([]),
  disputed: Object.freeze([]),
});

export const VALID_LICENCE_TRANSITIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  draft: Object.freeze(['active', 'rejected']),
  pending_review: Object.freeze(['active', 'rejected']),
  active: Object.freeze(['expired', 'revoked', 'superseded']),
  expired: Object.freeze([]),
  revoked: Object.freeze([]),
  superseded: Object.freeze([]),
  rejected: Object.freeze(['draft']),
});

export const VALID_EVIDENCE_TRANSITIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  active: Object.freeze(['invalid', 'superseded']),
  superseded: Object.freeze([]),
  invalid: Object.freeze([]),
  retained_for_history: Object.freeze([]),
});
