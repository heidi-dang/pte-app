import type { ProvenancePolicy, SourceType, LicenceType } from '@pte-app/contracts';

export const LOCAL_DEV_POLICY = Object.freeze({
  id: '00000000-0000-0000-0000-000000000001' as any,
  version: '1.0.0' as any,
  status: 'active' as const,
  effectiveFrom: '2024-01-01T00:00:00.000Z',
  effectiveUntil: null,
  similarityReviewThreshold: 0.3,
  similarityBlockThreshold: 0.6,
  expiryWarningDays: 30,
  evidenceRetentionDays: 2555,
  requiredEvidenceByOwnership: {
    platform_original: ['original_draft'],
    commissioned: ['licence_document', 'contributor_declaration'],
    contributor_owned: ['contributor_declaration'],
    licensed: ['licence_document'],
    public_domain: ['public_domain_evidence'],
    open_licence: ['open_licence_evidence'],
    authorised_reference: ['attribution_evidence'],
  },
  prohibitedRules: ['private_exam_material', 'copyrighted_without_permission'],
  supportedSourceTypes: [
    'original_creation_record',
    'contributor_declaration',
    'licence_agreement',
    'public_domain_record',
    'open_licence_source',
    'commissioned_work',
    'internal_reference',
    'authorised_external_reference',
  ] as readonly SourceType[],
  supportedLicenceTypes: ['exclusive', 'non_exclusive', 'open', 'public_domain', 'statutory'] as readonly LicenceType[],
}) satisfies ProvenancePolicy;
