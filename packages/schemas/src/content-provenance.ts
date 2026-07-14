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
  'SIMILARITY_CHECK_PENDING',
  'SIMILARITY_THRESHOLD_EXCEEDED',
  'PROHIBITED_CONTENT_MATCH',
  'CONTENT_VERSION_CHANGED',
  'REVERIFICATION_REQUIRED',
  'POLICY_VERSION_MISSING',
]);
