import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePublicationEligibility } from './eligibility.js';
import type { ProvenanceRecord, SourceRecord, LicenceRecord, ProvenancePolicy } from '@pte-app/contracts';

const validPolicy: ProvenancePolicy = {
  id: 'policy-001' as any,
  version: '1.0.0',
  similarityReviewThreshold: 30,
  similarityBlockThreshold: 60,
  expiryWarningDays: 30,
  evidenceRetentionDays: 365 * 7,
  requiredEvidenceByOwnership: {},
  prohibitedRules: [],
  supportedSourceTypes: ['original_creation_record'],
  supportedLicenceTypes: ['exclusive'],
};

function makeProvenance(overrides: Partial<ProvenanceRecord> = {}): ProvenanceRecord {
  return {
    id: crypto.randomUUID() as any,
    contentId: crypto.randomUUID() as any,
    contentVersionId: 'v1' as any,
    sourceId: crypto.randomUUID() as any,
    licenceId: crypto.randomUUID() as any,
    ownershipType: 'platform_original',
    verificationStatus: 'verified',
    publicationStatus: 'blocked',
    attribution: 'Test attribution',
    evidenceIds: [crypto.randomUUID() as any],
    similarityCheckId: null,
    createdBy: crypto.randomUUID() as any,
    reviewedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    expiresAt: null,
    supersedes: null,
    version: 1,
    ...overrides,
  };
}

function makeSource(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    id: crypto.randomUUID() as any,
    sourceType: 'original_creation_record',
    title: 'Test',
    owner: 'Platform',
    publisher: 'Platform',
    sourceUrl: '',
    jurisdiction: '',
    sourceDate: new Date().toISOString(),
    accessDate: new Date().toISOString(),
    description: '',
    status: 'active',
    evidenceIds: [],
    createdBy: crypto.randomUUID() as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

function makeLicence(overrides: Partial<LicenceRecord> = {}): LicenceRecord {
  return {
    id: crypto.randomUUID() as any,
    licenceType: 'exclusive',
    licensor: 'Platform',
    licensee: 'Platform',
    rightsGranted: [],
    prohibitedUses: [],
    attributionRequired: false,
    commercialUseAllowed: true,
    modificationAllowed: true,
    redistributionAllowed: true,
    validFrom: '2020-01-01',
    validUntil: null,
    jurisdiction: '',
    evidenceIds: [],
    status: 'active',
    supersedes: null,
    createdBy: crypto.randomUUID() as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

describe('publication eligibility', () => {
  it('blocks when provenance is missing', () => {
    const result = evaluatePublicationEligibility({
      provenance: null,
      source: null,
      licence: null,
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'PROVENANCE_MISSING'));
  });

  it('blocks when provenance is unverified', () => {
    const prov = makeProvenance({ verificationStatus: 'draft' });
    const result = evaluatePublicationEligibility({
      provenance: prov,
      source: makeSource(),
      licence: makeLicence(),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'PROVENANCE_UNVERIFIED'));
  });

  it('blocks when source is disputed', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource({ status: 'disputed' }),
      licence: makeLicence(),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'SOURCE_DISPUTED'));
  });

  it('blocks when licence is missing', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: null,
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'LICENCE_MISSING'));
  });

  it('blocks when licence is expired', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: makeLicence({ status: 'expired' }),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'LICENCE_EXPIRED'));
  });

  it('blocks when licence is revoked', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: makeLicence({ status: 'revoked' }),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'LICENCE_REVOKED'));
  });

  it('blocks when commercial use not allowed', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: makeLicence({ commercialUseAllowed: false }),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'COMMERCIAL_USE_NOT_ALLOWED'));
  });

  it('blocks when modification not allowed', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: makeLicence({ modificationAllowed: false }),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'MODIFICATION_NOT_ALLOWED'));
  });

  it('blocks when attribution required but missing', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance({ attribution: '' }),
      source: makeSource(),
      licence: makeLicence({ attributionRequired: true }),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'ATTRIBUTION_REQUIRED'));
  });

  it('blocks when evidence is missing', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance({ evidenceIds: [] }),
      source: makeSource(),
      licence: makeLicence(),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'EVIDENCE_MISSING'));
  });

  it('blocks when similarity check is pending', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: makeLicence(),
      similarity: {
        id: crypto.randomUUID() as any,
        contentId: crypto.randomUUID() as any,
        contentVersionId: 'v1' as any,
        providerId: 'local_test',
        profileVersion: '1.0.0',
        status: 'pending',
        similarityScore: null,
        matchedSources: [],
        completedAt: null,
        error: null,
        evidenceSnapshot: '',
      },
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'SIMILARITY_CHECK_PENDING'));
  });

  it('blocks when similarity exceeds block threshold', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: makeLicence(),
      similarity: {
        id: crypto.randomUUID() as any,
        contentId: crypto.randomUUID() as any,
        contentVersionId: 'v1' as any,
        providerId: 'local_test',
        profileVersion: '1.0.0',
        status: 'completed',
        similarityScore: 80,
        matchedSources: ['ref'],
        completedAt: new Date().toISOString(),
        error: null,
        evidenceSnapshot: '',
      },
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'SIMILARITY_THRESHOLD_EXCEEDED'));
  });

  it('blocks when content version changed', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance({ contentVersionId: 'v1' as any }),
      source: makeSource(),
      licence: makeLicence(),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v2',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'CONTENT_VERSION_CHANGED'));
  });

  it('blocks when re-verification required', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance({ verificationStatus: 're_verification_required' }),
      source: makeSource(),
      licence: makeLicence(),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some((b) => b.code === 'REVERIFICATION_REQUIRED'));
  });

  it('passes for fully eligible content', () => {
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: makeLicence(),
      similarity: {
        id: crypto.randomUUID() as any,
        contentId: crypto.randomUUID() as any,
        contentVersionId: 'v1' as any,
        providerId: 'local_test',
        profileVersion: '1.0.0',
        status: 'completed',
        similarityScore: 10,
        matchedSources: [],
        completedAt: new Date().toISOString(),
        error: null,
        evidenceSnapshot: '',
      },
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.equal(result.eligible, true);
    assert.equal(result.blockers.length, 0);
  });

  it('generates warnings for upcoming expiry', () => {
    const nearFuture = new Date(Date.now() + 5 * 86400000).toISOString();
    const result = evaluatePublicationEligibility({
      provenance: makeProvenance(),
      source: makeSource(),
      licence: makeLicence({ validUntil: nearFuture }),
      similarity: null,
      policy: validPolicy,
      contentVersionId: 'v1',
    });
    assert.ok(result.warnings.length > 0);
  });
});
