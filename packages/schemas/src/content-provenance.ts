import { z } from 'zod';

export const SourceTypeSchema = z.enum([
  'original_creation_record',
  'contributor_declaration',
  'licence_agreement',
  'public_domain_record',
  'open_licence_source',
  'commissioned_work',
  'internal_reference',
  'authorised_external_reference',
]);

export const OwnershipTypeSchema = z.enum([
  'platform_original',
  'commissioned',
  'contributor_owned',
  'licensed',
  'public_domain',
  'open_licence',
  'authorised_reference',
]);

export const SourceStatusSchema = z.enum(['draft', 'active', 'retired', 'disputed']);
export const LicenceStatusSchema = z.enum([
  'draft',
  'pending_review',
  'active',
  'expired',
  'revoked',
  'superseded',
  'rejected',
]);
export const VerificationStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'verified',
  'rejected',
  're_verification_required',
]);
export const PublicationStatusSchema = z.enum(['blocked', 'eligible', 'published', 'retired']);
export const EvidenceStatusSchema = z.enum(['active', 'superseded', 'invalid', 'retained_for_history']);
export const LicenceTypeSchema = z.enum(['exclusive', 'non_exclusive', 'open', 'public_domain', 'statutory']);
export const EvidenceTypeSchema = z.enum([
  'signed_agreement',
  'licence_document',
  'contributor_declaration',
  'original_draft',
  'source_screenshot',
  'source_archive',
  'public_domain_evidence',
  'open_licence_evidence',
  'attribution_evidence',
  'similarity_report',
]);
export const BlockerCodeSchema = z.enum([
  'PROVENANCE_MISSING',
  'PROVENANCE_UNVERIFIED',
  'SOURCE_DISPUTED',
  'LICENCE_MISSING',
  'LICENCE_EXPIRED',
  'LICENCE_REVOKED',
  'COMMERCIAL_USE_NOT_ALLOWED',
  'MODIFICATION_NOT_ALLOWED',
  'ATTRIBUTION_REQUIRED',
  'EVIDENCE_MISSING',
  'EVIDENCE_INVALID',
  'EVIDENCE_NOT_FOUND',
  'EVIDENCE_REQUIRED_TYPE_MISSING',
  'EVIDENCE_SUPERSEDED',
  'EVIDENCE_RETENTION_INVALID',
  'SIMILARITY_CHECK_PENDING',
  'SIMILARITY_THRESHOLD_EXCEEDED',
  'PROHIBITED_CONTENT_MATCH',
  'CONTENT_VERSION_CHANGED',
  'REVERIFICATION_REQUIRED',
  'POLICY_VERSION_MISSING',
]);

export const AuditEventTypeSchema = z.enum([
  'source_created',
  'source_updated',
  'source_retired',
  'source_disputed',
  'licence_created',
  'licence_updated',
  'licence_superseded',
  'licence_revoked',
  'evidence_attached',
  'evidence_invalidated',
  'provenance_created',
  'provenance_updated',
  'provenance_submitted',
  'provenance_review_started',
  'provenance_verified',
  'provenance_rejected',
  'similarity_requested',
  'similarity_completed',
  'similarity_failed',
  'publication_allowed',
  'publication_blocked',
  'reverification_created',
  'reverification_completed',
  'report_generated',
]);

export const ProvenanceTransitionSchema = z.enum([
  'create',
  'update',
  'submit',
  'start_review',
  'verify',
  'reject',
  'require_re_verification',
]);

export const SourceRecordSchema = z.object({
  id: z.string().uuid(),
  sourceType: SourceTypeSchema,
  title: z.string().min(1).max(500),
  owner: z.string().min(1).max(500),
  publisher: z.string().min(1).max(500),
  sourceUrl: z.string().url().or(z.literal('')),
  jurisdiction: z.string().max(200),
  sourceDate: z.string(),
  accessDate: z.string(),
  description: z.string().max(5000),
  status: SourceStatusSchema,
  evidenceIds: z.array(z.string().uuid()),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
});

export const LicenceRecordSchema = z.object({
  id: z.string().uuid(),
  licenceType: LicenceTypeSchema,
  licensor: z.string().min(1).max(500),
  licensee: z.string().min(1).max(500),
  rightsGranted: z.array(z.string()),
  prohibitedUses: z.array(z.string()),
  attributionRequired: z.boolean(),
  commercialUseAllowed: z.boolean(),
  modificationAllowed: z.boolean(),
  redistributionAllowed: z.boolean(),
  validFrom: z.string(),
  validUntil: z.string().nullable(),
  jurisdiction: z.string().max(200),
  evidenceIds: z.array(z.string().uuid()),
  status: LicenceStatusSchema,
  supersedes: z.string().uuid().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
});

export const CreateSourceBodySchema = z.object({
  sourceType: SourceTypeSchema,
  title: z.string().min(1).max(500),
  owner: z.string().min(1).max(500),
  publisher: z.string().min(1).max(500),
  sourceUrl: z.string().url().or(z.literal('')).default(''),
  jurisdiction: z.string().max(200).default(''),
  sourceDate: z.string(),
  accessDate: z.string(),
  description: z.string().max(5000).default(''),
});

export const UpdateSourceBodySchema = z.object({
  sourceType: SourceTypeSchema.optional(),
  title: z.string().min(1).max(500).optional(),
  owner: z.string().min(1).max(500).optional(),
  publisher: z.string().min(1).max(500).optional(),
  sourceUrl: z.string().url().or(z.literal('')).optional(),
  jurisdiction: z.string().max(200).optional(),
  sourceDate: z.string().optional(),
  accessDate: z.string().optional(),
  description: z.string().max(5000).optional(),
  status: SourceStatusSchema.optional(),
  expectedVersion: z.number().int().positive(),
});

export const CreateLicenceBodySchema = z.object({
  licenceType: LicenceTypeSchema,
  licensor: z.string().min(1).max(500),
  licensee: z.string().min(1).max(500),
  rightsGranted: z.array(z.string()).default([]),
  prohibitedUses: z.array(z.string()).default([]),
  attributionRequired: z.boolean().default(false),
  commercialUseAllowed: z.boolean().default(false),
  modificationAllowed: z.boolean().default(false),
  redistributionAllowed: z.boolean().default(false),
  validFrom: z.string(),
  validUntil: z.string().nullable().default(null),
  jurisdiction: z.string().max(200).default(''),
});

export const UpdateLicenceBodySchema = z.object({
  licenceType: LicenceTypeSchema.optional(),
  licensor: z.string().min(1).max(500).optional(),
  licensee: z.string().min(1).max(500).optional(),
  rightsGranted: z.array(z.string()).optional(),
  prohibitedUses: z.array(z.string()).optional(),
  attributionRequired: z.boolean().optional(),
  commercialUseAllowed: z.boolean().optional(),
  modificationAllowed: z.boolean().optional(),
  redistributionAllowed: z.boolean().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().nullable().optional(),
  jurisdiction: z.string().max(200).optional(),
  expectedVersion: z.number().int().positive(),
});

export const SupersedeLicenceBodySchema = z.object({
  licenceType: LicenceTypeSchema,
  licensor: z.string().min(1).max(500),
  licensee: z.string().min(1).max(500),
  rightsGranted: z.array(z.string()).default([]),
  prohibitedUses: z.array(z.string()).default([]),
  attributionRequired: z.boolean().default(false),
  commercialUseAllowed: z.boolean().default(false),
  modificationAllowed: z.boolean().default(false),
  redistributionAllowed: z.boolean().default(false),
  validFrom: z.string(),
  validUntil: z.string().nullable().default(null),
  jurisdiction: z.string().max(200).default(''),
  reason: z.string().min(1).max(500),
});

export const CreateEvidenceBodySchema = z.object({
  evidenceType: EvidenceTypeSchema,
  fileName: z.string().min(1).max(500),
  mediaId: z.string().min(1).max(255),
  checksum: z.string().min(1).max(128),
  mimeType: z.string().min(1).max(128),
  description: z.string().max(5000).default(''),
});

export const CreateProvenanceBodySchema = z.object({
  contentId: z.string().min(1).max(128),
  contentVersionId: z.string().min(1).max(128),
  sourceId: z.string().uuid(),
  licenceId: z.string().uuid().nullable().default(null),
  ownershipType: OwnershipTypeSchema,
  attribution: z.string().max(5000).default(''),
  evidenceIds: z.array(z.string().uuid()).default([]),
});

export const UpdateProvenanceBodySchema = z.object({
  sourceId: z.string().uuid().optional(),
  licenceId: z.string().uuid().nullable().optional(),
  ownershipType: OwnershipTypeSchema.optional(),
  attribution: z.string().max(5000).optional(),
  evidenceIds: z.array(z.string().uuid()).optional(),
  expectedVersion: z.number().int().positive(),
});

export const RejectProvenanceBodySchema = z.object({
  reason: z.string().min(1).max(2000),
});

export const PublicationCheckBodySchema = z.object({
  contentId: z.string().min(1).max(128),
  contentVersionId: z.string().min(1).max(128),
});

export const SimilarityCheckCreateBodySchema = z.object({
  contentId: z.string().min(1).max(128),
  contentVersionId: z.string().min(1).max(128),
});

export const ReVerificationRetryBodySchema = z.object({
  reason: z.string().min(1).max(2000).optional(),
});

export const ReVerificationCompleteBodySchema = z.object({
  result: z.enum(['passed', 'failed']),
  reason: z.string().min(1).max(2000).optional(),
});

export const AuditReportQuerySchema = z.object({
  scope: z.string().default('all'),
});
