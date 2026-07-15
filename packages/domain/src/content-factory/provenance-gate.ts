import type { ProvenanceGateResult, ContentProvenanceRecord } from '@pte-app/contracts';

export function evaluateProvenanceGate(
  record: ContentProvenanceRecord | null,
  requireProvenance: boolean,
): ProvenanceGateResult {
  const blocks: Array<{ reason: string; field: string }> = [];
  const warnings: string[] = [];

  if (!requireProvenance) return { passed: true, blocks: [], warnings: [] };

  if (!record) {
    blocks.push({ reason: 'No provenance record exists', field: 'provenance' });
    return { passed: false, blocks, warnings };
  }

  if (record.licenceStatus !== 'valid') {
    blocks.push({ reason: `Licence status is ${record.licenceStatus}`, field: 'licenceStatus' });
  }
  if (!record.creatorDeclaration) {
    blocks.push({ reason: 'Creator declaration missing', field: 'creatorDeclaration' });
  }
  if (!record.reviewerConfirmation) {
    blocks.push({ reason: 'Reviewer confirmation missing', field: 'reviewerConfirmation' });
  }

  return { passed: blocks.length === 0, blocks, warnings };
}
