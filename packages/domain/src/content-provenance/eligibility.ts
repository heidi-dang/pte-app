import type {
  ProvenanceRecord,
  SourceRecord,
  LicenceRecord,
  SimilarityCheck,
  PublicationEligibilityResult,
  PublicationBlocker,
  ProvenancePolicy,
} from '@pte-app/contracts';

export function evaluatePublicationEligibility(input: {
  provenance: ProvenanceRecord | null;
  source: SourceRecord | null;
  licence: LicenceRecord | null;
  similarity: SimilarityCheck | null;
  policy: ProvenancePolicy;
  contentVersionId: string;
}): PublicationEligibilityResult {
  const blockers: PublicationBlocker[] = [];
  const warnings: string[] = [];
  const requiredActions: string[] = [];

  const now = new Date().toISOString();

  if (!input.provenance) {
    blockers.push({ code: 'PROVENANCE_MISSING', message: 'No provenance record exists for this content' });
  } else {
    if (input.provenance.verificationStatus !== 'verified') {
      blockers.push({
        code: 'PROVENANCE_UNVERIFIED',
        message: `Provenance status is ${input.provenance.verificationStatus}, must be verified`,
      });
    }
    if (input.provenance.contentVersionId !== input.contentVersionId) {
      blockers.push({ code: 'CONTENT_VERSION_CHANGED', message: 'Content version differs from verified version' });
    }
    if (input.provenance.expiresAt && input.provenance.expiresAt <= now) {
      blockers.push({ code: 'REVERIFICATION_REQUIRED', message: 'Provenance has expired, re-verification required' });
    }
  }

  if (!input.source) {
    blockers.push({ code: 'SOURCE_DISPUTED', message: 'No source record found' });
  } else if (input.source.status === 'disputed' || input.source.status === 'retired') {
    blockers.push({ code: 'SOURCE_DISPUTED', message: `Source status is ${input.source.status}` });
  }

  if (!input.licence) {
    blockers.push({ code: 'LICENCE_MISSING', message: 'No licence record found' });
  } else {
    if (input.licence.status === 'expired' || (input.licence.validUntil && input.licence.validUntil <= now)) {
      blockers.push({ code: 'LICENCE_EXPIRED', message: 'Licence has expired' });
    }
    if (input.licence.status === 'revoked') {
      blockers.push({ code: 'LICENCE_REVOKED', message: 'Licence has been revoked' });
    }
    if (!input.licence.commercialUseAllowed) {
      blockers.push({ code: 'COMMERCIAL_USE_NOT_ALLOWED', message: 'Licence does not permit commercial use' });
    }
    if (!input.licence.modificationAllowed) {
      blockers.push({ code: 'MODIFICATION_NOT_ALLOWED', message: 'Licence does not permit modification' });
    }
    if (input.licence.attributionRequired && !input.provenance?.attribution) {
      blockers.push({ code: 'ATTRIBUTION_REQUIRED', message: 'Attribution is required but missing' });
    }
    if (input.licence.validUntil) {
      const validUntilDate = new Date(input.licence.validUntil);
      if (validUntilDate <= new Date()) {
        blockers.push({ code: 'LICENCE_EXPIRED', message: 'Licence has expired' });
      } else {
        const daysUntilExpiry = Math.ceil((validUntilDate.getTime() - Date.now()) / 86400000);
        if (daysUntilExpiry <= input.policy.expiryWarningDays) {
          warnings.push(`Licence expires in ${daysUntilExpiry} days`);
        }
      }
    }
  }

  if (input.provenance && input.provenance.evidenceIds.length === 0) {
    blockers.push({ code: 'EVIDENCE_MISSING', message: 'No evidence attached to provenance' });
  }

  if (!input.similarity) {
    blockers.push({ code: 'SIMILARITY_CHECK_PENDING', message: 'Similarity check has not been performed' });
  } else if (input.similarity.status === 'pending' || input.similarity.status === 'running') {
    blockers.push({ code: 'SIMILARITY_CHECK_PENDING', message: 'Similarity check is still in progress' });
  } else if (input.similarity.status === 'completed' && input.similarity.similarityScore !== null) {
    if (input.similarity.similarityScore > input.policy.similarityBlockThreshold) {
      blockers.push({
        code: 'SIMILARITY_THRESHOLD_EXCEEDED',
        message: `Similarity score ${input.similarity.similarityScore} exceeds block threshold ${input.policy.similarityBlockThreshold}`,
      });
    } else if (input.similarity.similarityScore > input.policy.similarityReviewThreshold) {
      warnings.push(`Similarity score ${input.similarity.similarityScore} exceeds review threshold`);
    }
  }

  if (input.provenance?.verificationStatus === 're_verification_required') {
    blockers.push({ code: 'REVERIFICATION_REQUIRED', message: 'Content requires re-verification' });
  }

  if (!input.policy.version) {
    blockers.push({ code: 'POLICY_VERSION_MISSING', message: 'Policy version is missing' });
  }

  if (blockers.length > 0) {
    requiredActions.push(...blockers.map((b) => b.message));
  }

  return {
    eligible: blockers.length === 0,
    evaluatedAt: now,
    policyVersion: input.policy.version,
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
    provenanceRecordId: input.provenance?.id ?? null,
    licenceRecordId: input.licence?.id ?? null,
    requiredActions: Object.freeze(requiredActions),
  };
}
