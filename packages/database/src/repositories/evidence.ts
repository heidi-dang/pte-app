import type { DatabaseConnection } from '../client.js';
import type { EvidenceRecord, EvidenceId, UserId, EvidenceType } from '@pte-app/contracts';

export async function createEvidence(
  connection: DatabaseConnection,
  input: {
    id: EvidenceId;
    evidenceType: EvidenceType;
    fileName: string;
    mediaId: string;
    checksum: string;
    mimeType: string;
    description: string;
    uploadedBy: UserId;
    retainedUntil: string;
  },
): Promise<EvidenceRecord> {
  const result = await connection.pool.query<EvidenceRecord>(
    `INSERT INTO content_evidence (id, evidence_type, file_name, media_id, checksum, mime_type, description, uploaded_by, retained_until)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, evidence_type as "evidenceType", file_name as "fileName", media_id as "mediaId",
               checksum, mime_type as "mimeType", description, uploaded_by as "uploadedBy",
               uploaded_at as "uploadedAt", retained_until as "retainedUntil", status`,
    [
      input.id,
      input.evidenceType,
      input.fileName,
      input.mediaId,
      input.checksum,
      input.mimeType,
      input.description,
      input.uploadedBy,
      input.retainedUntil,
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to create evidence');
  return result.rows[0];
}

export async function getEvidenceById(
  connection: DatabaseConnection,
  id: EvidenceId,
): Promise<EvidenceRecord | undefined> {
  const result = await connection.pool.query<EvidenceRecord>(
    `SELECT id, evidence_type as "evidenceType", file_name as "fileName", media_id as "mediaId",
            checksum, mime_type as "mimeType", description, uploaded_by as "uploadedBy",
            uploaded_at as "uploadedAt", retained_until as "retainedUntil", status
     FROM content_evidence WHERE id = $1`,
    [id],
  );
  return result.rows[0];
}
