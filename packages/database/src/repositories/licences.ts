import type { DatabaseConnection } from '../client.js';
import type { LicenceRecord, LicenceId, UserId, LicenceType } from '@pte-app/contracts';

export async function createLicence(
  connection: DatabaseConnection,
  input: {
    id: LicenceId;
    licenceType: LicenceType;
    licensor: string;
    licensee: string;
    rightsGranted: string[];
    prohibitedUses: string[];
    attributionRequired: boolean;
    commercialUseAllowed: boolean;
    modificationAllowed: boolean;
    redistributionAllowed: boolean;
    validFrom: string;
    validUntil: string | null;
    jurisdiction: string;
    createdBy: UserId;
  },
): Promise<LicenceRecord> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `INSERT INTO content_licences (id, licence_type, licensor, licensee, rights_granted, prohibited_uses, attribution_required, commercial_use_allowed, modification_allowed, redistribution_allowed, valid_from, valid_until, jurisdiction, status, created_by)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,'draft',$14)
     RETURNING id, licence_type as "licenceType", licensor, licensee, rights_granted as "rightsGranted", prohibited_uses as "prohibitedUses",
               attribution_required as "attributionRequired", commercial_use_allowed as "commercialUseAllowed",
               modification_allowed as "modificationAllowed", redistribution_allowed as "redistributionAllowed",
               valid_from as "validFrom", valid_until as "validUntil", jurisdiction, status,
               evidence_ids as "evidenceIds", supersedes, created_by as "createdBy",
               created_at as "createdAt", updated_at as "updatedAt", version`,
    [
      input.id,
      input.licenceType,
      input.licensor,
      input.licensee,
      JSON.stringify(input.rightsGranted),
      JSON.stringify(input.prohibitedUses),
      input.attributionRequired,
      input.commercialUseAllowed,
      input.modificationAllowed,
      input.redistributionAllowed,
      input.validFrom,
      input.validUntil,
      input.jurisdiction,
      input.createdBy,
    ],
  );
  if (!result.rows[0]) throw new Error('Failed to create licence');
  return result.rows[0] as unknown as LicenceRecord;
}

export async function getLicenceById(
  connection: DatabaseConnection,
  id: LicenceId,
): Promise<LicenceRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, licence_type as "licenceType", licensor, licensee, rights_granted as "rightsGranted", prohibited_uses as "prohibitedUses",
            attribution_required as "attributionRequired", commercial_use_allowed as "commercialUseAllowed",
            modification_allowed as "modificationAllowed", redistribution_allowed as "redistributionAllowed",
            valid_from as "validFrom", valid_until as "validUntil", jurisdiction, status,
            evidence_ids as "evidenceIds", supersedes, created_by as "createdBy",
            created_at as "createdAt", updated_at as "updatedAt", version
     FROM content_licences WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as LicenceRecord;
}

export async function updateLicence(
  connection: DatabaseConnection,
  id: LicenceId,
  input: Partial<
    Pick<
      LicenceRecord,
      | 'licenceType'
      | 'licensor'
      | 'licensee'
      | 'rightsGranted'
      | 'prohibitedUses'
      | 'attributionRequired'
      | 'commercialUseAllowed'
      | 'modificationAllowed'
      | 'redistributionAllowed'
      | 'validFrom'
      | 'validUntil'
      | 'jurisdiction'
      | 'status'
    >
  >,
  expectedVersion: number,
): Promise<LicenceRecord | undefined> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const colMap: Record<string, string> = {
    licenceType: 'licence_type',
    licensor: 'licensor',
    licensee: 'licensee',
    rightsGranted: 'rights_granted',
    prohibitedUses: 'prohibited_uses',
    attributionRequired: 'attribution_required',
    commercialUseAllowed: 'commercial_use_allowed',
    modificationAllowed: 'modification_allowed',
    redistributionAllowed: 'redistribution_allowed',
    validFrom: 'valid_from',
    validUntil: 'valid_until',
    jurisdiction: 'jurisdiction',
    status: 'status',
  };

  for (const [k, v] of Object.entries(input)) {
    const col = colMap[k] ?? k;
    const val = k === 'rightsGranted' || k === 'prohibitedUses' ? JSON.stringify(v) : v;
    fields.push(`${col} = $${idx++}`);
    values.push(val);
  }

  if (fields.length === 0) return undefined;
  fields.push(`version = version + 1, updated_at = NOW()`);

  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_licences SET ${fields.join(', ')} WHERE id = $${idx} AND version = $${idx + 1}
     RETURNING id, licence_type as "licenceType", licensor, licensee, rights_granted as "rightsGranted", prohibited_uses as "prohibitedUses",
               attribution_required as "attributionRequired", commercial_use_allowed as "commercialUseAllowed",
               modification_allowed as "modificationAllowed", redistribution_allowed as "redistributionAllowed",
               valid_from as "validFrom", valid_until as "validUntil", jurisdiction, status,
               evidence_ids as "evidenceIds", supersedes, created_by as "createdBy",
               created_at as "createdAt", updated_at as "updatedAt", version`,
    [...values, id, expectedVersion],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as LicenceRecord;
}

export async function listLicences(connection: DatabaseConnection): Promise<LicenceRecord[]> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `SELECT id, licence_type as "licenceType", licensor, licensee, rights_granted as "rightsGranted", prohibited_uses as "prohibitedUses",
            attribution_required as "attributionRequired", commercial_use_allowed as "commercialUseAllowed",
            modification_allowed as "modificationAllowed", redistribution_allowed as "redistributionAllowed",
            valid_from as "validFrom", valid_until as "validUntil", jurisdiction, status,
            evidence_ids as "evidenceIds", supersedes, created_by as "createdBy",
            created_at as "createdAt", updated_at as "updatedAt", version
     FROM content_licences ORDER BY created_at DESC`,
  );
  return result.rows as unknown as LicenceRecord[];
}

export async function supersedeLicence(
  connection: DatabaseConnection,
  oldId: LicenceId,
  newId: LicenceId,
): Promise<void> {
  await connection.pool.query('UPDATE content_licences SET status = $1, updated_at = NOW() WHERE id = $2', [
    'superseded',
    oldId,
  ]);
  await connection.pool.query('UPDATE content_licences SET supersedes = $1 WHERE id = $2', [oldId, newId]);
}

export async function activateLicence(
  connection: DatabaseConnection,
  id: LicenceId,
): Promise<LicenceRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_licences SET status = 'active', updated_at = NOW()
     WHERE id = $1 AND status = 'draft'
     RETURNING id, licence_type as "licenceType", licensor, licensee, rights_granted as "rightsGranted", prohibited_uses as "prohibitedUses",
               attribution_required as "attributionRequired", commercial_use_allowed as "commercialUseAllowed",
               modification_allowed as "modificationAllowed", redistribution_allowed as "redistributionAllowed",
               valid_from as "validFrom", valid_until as "validUntil", jurisdiction, status,
               evidence_ids as "evidenceIds", supersedes, created_by as "createdBy",
               created_at as "createdAt", updated_at as "updatedAt", version`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as LicenceRecord;
}

export async function revokeLicence(connection: DatabaseConnection, id: LicenceId): Promise<LicenceRecord | undefined> {
  const result = await connection.pool.query<Record<string, unknown>>(
    `UPDATE content_licences SET status = 'revoked', updated_at = NOW()
     WHERE id = $1 AND status = 'active'
     RETURNING id, licence_type as "licenceType", licensor, licensee, rights_granted as "rightsGranted", prohibited_uses as "prohibitedUses",
               attribution_required as "attributionRequired", commercial_use_allowed as "commercialUseAllowed",
               modification_allowed as "modificationAllowed", redistribution_allowed as "redistributionAllowed",
               valid_from as "validFrom", valid_until as "validUntil", jurisdiction, status,
               evidence_ids as "evidenceIds", supersedes, created_by as "createdBy",
               created_at as "createdAt", updated_at as "updatedAt", version`,
    [id],
  );
  if (!result.rows[0]) return undefined;
  return result.rows[0] as unknown as LicenceRecord;
}
