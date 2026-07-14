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

export type SimilarityProviderId = 'local_test' | string;

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

export type ContentId = string & { __brand: 'ContentId' };
export type ContentVersionId = string & { __brand: 'ContentVersionId' };
export type SourceId = string & { __brand: 'SourceId' };
export type LicenceId = string & { __brand: 'LicenceId' };
export type EvidenceId = string & { __brand: 'EvidenceId' };
export type ProvenanceId = string & { __brand: 'ProvenanceId' };
export type SimilarityCheckId = string & { __brand: 'SimilarityCheckId' };
export type PolicyId = string & { __brand: 'PolicyId' };
export type ReVerificationJobId = string & { __brand: 'ReVerificationJobId' };
export type UserId = string & { __brand: 'UserId' };

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
  readonly mediaId: string;
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
  readonly policyVersion: string;
  readonly blockers: readonly PublicationBlocker[];
  readonly warnings: readonly string[];
  readonly provenanceRecordId: ProvenanceId | null;
  readonly licenceRecordId: LicenceId | null;
  readonly requiredActions: readonly string[];
}

export interface ProvenanceAuditReport {
  readonly generatedAt: string;
  readonly scope: string;
  policyVersion: string;
  totals: Record<string, number>;
  expiringLicences: readonly string[];
  blockedContent: readonly string[];
  missingEvidence: readonly string[];
  pendingReviews: number;
  unverifiableItems: readonly string[];
  historicalChanges: readonly string[];
}

export interface ReVerificationJob {
  readonly id: ReVerificationJobId;
  readonly provenanceId: ProvenanceId;
  readonly reason: string;
  readonly createdAt: string;
  readonly status: 'pending' | 'completed' | 'failed';
}

export interface ProvenancePolicy {
  readonly id: PolicyId;
  readonly version: string;
  readonly similarityReviewThreshold: number;
  readonly similarityBlockThreshold: number;
  readonly expiryWarningDays: number;
  readonly evidenceRetentionDays: number;
  readonly requiredEvidenceByOwnership: Record<string, readonly string[]>;
  readonly prohibitedRules: readonly string[];
  readonly supportedSourceTypes: readonly SourceType[];
  readonly supportedLicenceTypes: readonly LicenceType[];
}
