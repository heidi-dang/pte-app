import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { ProvenanceService } from './service.js';
import type { ProvenanceEntry, LicenceRecord } from './types.js';

describe('ProvenanceService', () => {
  let service: ProvenanceService;

  before(() => {
    service = new ProvenanceService(new Map(), new Map());
  });

  it('records provenance entry', async () => {
    const entry: ProvenanceEntry = {
      contentId: 'cnt_001',
      version: 1,
      source: 'original',
      authorId: 'usr_author',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await service.recordProvenance(entry);
    assert.equal(result.contentId, 'cnt_001');
  });

  it('retrieves provenance entry', async () => {
    const result = await service.getProvenance('cnt_001');
    assert.ok(result);
    assert.equal(result!.source, 'original');
  });

  it('returns null for missing entry', async () => {
    const result = await service.getProvenance('cnt_missing');
    assert.equal(result, null);
  });

  it('registers and retrieves licence', async () => {
    const licence: LicenceRecord = {
      id: 'lic_001',
      licenceType: 'creative_commons',
      holder: 'Open Source Author',
      grantedAt: '2026-01-01',
      attributionRequired: true,
      restrictions: [],
    };
    await service.registerLicence(licence);
    const result = await service.getLicence('lic_001');
    assert.ok(result);
    assert.equal(result!.licenceType, 'creative_commons');
  });

  it('records audit events', async () => {
    const audit = await service.getAuditLog();
    assert.ok(audit.length > 0);
  });

  it('generates audit report', async () => {
    const report = await service.getAuditReport();
    assert.ok(report.totalEvents > 0);
    assert.ok(report.byAction.create);
  });
});
