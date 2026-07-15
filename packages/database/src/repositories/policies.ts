import type { DatabaseConnection } from '../client.js';
import type { ProvenancePolicy, PolicyId, PolicyVersion } from '@pte-app/contracts';

export async function createPolicy(
  connection: DatabaseConnection,
  input: {
    id: PolicyId;
    version: PolicyVersion;
    status: 'draft' | 'active' | 'retired';
    effectiveFrom: string;
    effectiveUntil: string | null;
    similarityReviewThreshold: number;
    similarityBlockThreshold: number;
    expiryWarningDays: number;
    evidenceRetentionDays: number;
    requiredEvidenceByOwnership: Record<string, string[]>;
    prohibitedRules: string[];
    supportedSourceTypes: string[];
    supportedLicenceTypes: string[];
  },
): Promise<ProvenancePolicy> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_policies (id, version, status, effective_from, effective_until,
      similarity_review_threshold, similarity_block_threshold, expiry_warning_days, evidence_retention_days,
      required_evidence_by_ownership, prohibited_rules, supported_source_types, supported_licence_types)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb)
     RETURNING id, version, status, effective_from as "effectiveFrom", effective_until as "effectiveUntil",
               similarity_review_threshold as "similarityReviewThreshold",
               similarity_block_threshold as "similarityBlockThreshold",
               expiry_warning_days as "expiryWarningDays",
               evidence_retention_days as "evidenceRetentionDays",
               required_evidence_by_ownership as "requiredEvidenceByOwnership",
               prohibited_rules as "prohibitedRules",
               supported_source_types as "supportedSourceTypes",
               supported_licence_types as "supportedLicenceTypes"`,
    [
      input.id,
      input.version,
      input.status,
      input.effectiveFrom,
      input.effectiveUntil,
      input.similarityReviewThreshold,
      input.similarityBlockThreshold,
      input.expiryWarningDays,
      input.evidenceRetentionDays,
      JSON.stringify(input.requiredEvidenceByOwnership),
      JSON.stringify(input.prohibitedRules),
      JSON.stringify(input.supportedSourceTypes),
      JSON.stringify(input.supportedLicenceTypes),
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to create policy');
  return result.rows[0] as unknown as ProvenancePolicy;
}

export async function getActivePolicy(connection: DatabaseConnection): Promise<ProvenancePolicy | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, version, status, effective_from as "effectiveFrom", effective_until as "effectiveUntil",
            similarity_review_threshold as "similarityReviewThreshold",
            similarity_block_threshold as "similarityBlockThreshold",
            expiry_warning_days as "expiryWarningDays",
            evidence_retention_days as "evidenceRetentionDays",
            required_evidence_by_ownership as "requiredEvidenceByOwnership",
            prohibited_rules as "prohibitedRules",
            supported_source_types as "supportedSourceTypes",
            supported_licence_types as "supportedLicenceTypes"
     FROM content_policies
     WHERE status = 'active'
     ORDER BY effective_from DESC
     LIMIT 1`,
  );
  return result.rows[0] as unknown as ProvenancePolicy | undefined;
}

export async function getPolicyById(
  connection: DatabaseConnection,
  id: PolicyId,
): Promise<ProvenancePolicy | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, version, status, effective_from as "effectiveFrom", effective_until as "effectiveUntil",
            similarity_review_threshold as "similarityReviewThreshold",
            similarity_block_threshold as "similarityBlockThreshold",
            expiry_warning_days as "expiryWarningDays",
            evidence_retention_days as "evidenceRetentionDays",
            required_evidence_by_ownership as "requiredEvidenceByOwnership",
            prohibited_rules as "prohibitedRules",
            supported_source_types as "supportedSourceTypes",
            supported_licence_types as "supportedLicenceTypes"
     FROM content_policies WHERE id = $1`,
    [id],
  );
  return result.rows[0] as unknown as ProvenancePolicy | undefined;
}

export async function listPolicies(connection: DatabaseConnection): Promise<ProvenancePolicy[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, version, status, effective_from as "effectiveFrom", effective_until as "effectiveUntil",
            similarity_review_threshold as "similarityReviewThreshold",
            similarity_block_threshold as "similarityBlockThreshold",
            expiry_warning_days as "expiryWarningDays",
            evidence_retention_days as "evidenceRetentionDays",
            required_evidence_by_ownership as "requiredEvidenceByOwnership",
            prohibited_rules as "prohibitedRules",
            supported_source_types as "supportedSourceTypes",
            supported_licence_types as "supportedLicenceTypes"
     FROM content_policies ORDER BY effective_from DESC`,
  );
  return result.rows as unknown as ProvenancePolicy[];
}
