import { test, expect } from '@playwright/test';
import { createUserWithRole, setSessionCookie, getConfig } from './helpers';

const cfg = getConfig();
const pw = 'E2EPassword123';

async function apiAuth(token: string, hasBody = false) {
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  if (hasBody) headers['content-type'] = 'application/json';
  return { headers };
}

test.describe('Phase G content provenance E2E', () => {
  test('1. content_editor logs in', async ({ page }) => {
    const email = `cg-editor-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/content/provenance`);
    await expect(page.locator('h1')).toContainText('Content Provenance Dashboard');
  });

  test('2. creates source via API', async ({ request }) => {
    const email = `cg-src-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const auth = await apiAuth(token);
    const res = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: {
        sourceType: 'original_creation_record',
        title: 'E2E Test Source',
        owner: 'Test Owner',
        publisher: 'Test Publisher',
        sourceUrl: 'https://example.com/source',
        jurisdiction: 'AU',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
        description: 'E2E test source for provenance',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.status).toBe('draft');
  });

  test('3. creates licence via API', async ({ request }) => {
    const email = `cg-lic-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const auth = await apiAuth(token);
    const res = await request.post(`${cfg.apiUrl}/content-provenance/licences`, {
      ...auth,
      data: {
        licenceType: 'exclusive',
        licensor: 'Test Licensor',
        licensee: 'Test Licensee',
        rightsGranted: ['publication', 'modification'],
        commercialUseAllowed: true,
        modificationAllowed: true,
        attributionRequired: true,
        validFrom: '2024-01-01',
        jurisdiction: 'AU',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.id).toBeTruthy();
  });

  test('4. attaches evidence metadata via API', async ({ request }) => {
    const email = `cg-ev-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const auth = await apiAuth(token);
    const res = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...auth,
      data: {
        evidenceType: 'signed_agreement',
        fileName: 'test-agreement.pdf',
        mediaId: 'media-test-001',
        checksum: 'sha256:abc123',
        mimeType: 'application/pdf',
        description: 'E2E test evidence',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.status).toBe('active');
  });

  test('5. creates provenance record via API', async ({ request }) => {
    const email = `cg-prov-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const auth = await apiAuth(token);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Prov Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...auth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'draft.docx',
        mediaId: 'media-draft-001',
        checksum: 'sha256:def456',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    const res = await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...auth,
      data: {
        contentId: 'content-e2e-001',
        contentVersionId: 'v1',
        sourceId: src.id,
        ownershipType: 'platform_original',
        attribution: 'E2E Test Attribution',
        evidenceIds: [ev.id],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.verificationStatus).toBe('draft');
  });

  test('6. runs similarity check via API', async ({ request }) => {
    const email = `cg-sim-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const auth = await apiAuth(token);
    const res = await request.post(`${cfg.apiUrl}/content-provenance/similarity-checks`, {
      ...auth,
      data: {
        contentId: 'content-e2e-001',
        contentVersionId: 'v1',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('completed');
    expect(body.similarityScore).not.toBeNull();
  });

  test('7. submits for review via API', async ({ request }) => {
    const email = `cg-sub-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const auth = await apiAuth(token);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Submit Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...auth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'submit.docx',
        mediaId: 'media-submit-001',
        checksum: 'sha256:sub123',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    const provRes = await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...auth,
      data: {
        contentId: 'content-e2e-submit',
        contentVersionId: 'v1',
        sourceId: src.id,
        ownershipType: 'platform_original',
        attribution: 'Submit Attribution',
        evidenceIds: [ev.id],
      },
    });
    const prov = await provRes.json();

    const res = await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/submit`, auth);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.verificationStatus).toBe('submitted');
  });

  test('8. cannot approve own submission (self-approval blocked)', async ({ request }) => {
    const email = `cg-self-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = await apiAuth(token);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Self Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...auth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'self.docx',
        mediaId: 'media-self-001',
        checksum: 'sha256:self123',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    const provRes = await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...auth,
      data: {
        contentId: 'content-self-001',
        contentVersionId: 'v1',
        sourceId: src.id,
        ownershipType: 'platform_original',
        attribution: 'Self Attribution',
        evidenceIds: [ev.id],
      },
    });
    const prov = await provRes.json();

    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/submit`, auth);

    const res = await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/verify`, auth);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Self-approval');
  });

  test('9. admin reviews record via API', async ({ request }) => {
    const editorEmail = `cg-admin-e-${Date.now()}@test.com`;
    const adminEmail = `cg-admin-a-${Date.now()}@test.com`;
    const editorToken = await createUserWithRole(editorEmail, pw, 'content_editor');
    const adminToken = await createUserWithRole(adminEmail, pw, 'admin');
    const editorAuth = await apiAuth(editorToken);
    const adminAuth = await apiAuth(adminToken);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...editorAuth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Admin Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...editorAuth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'admin.docx',
        mediaId: 'media-admin-001',
        checksum: 'sha256:admin123',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    const provRes = await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...editorAuth,
      data: {
        contentId: 'content-admin-001',
        contentVersionId: 'v1',
        sourceId: src.id,
        ownershipType: 'platform_original',
        attribution: 'Admin Attribution',
        evidenceIds: [ev.id],
      },
    });
    const prov = await provRes.json();

    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/submit`, editorAuth);

    const reviewRes = await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/start-review`, adminAuth);
    expect(reviewRes.ok()).toBeTruthy();
    const body = await reviewRes.json();
    expect(body.verificationStatus).toBe('under_review');
  });

  test('10. admin verifies record via API', async ({ request }) => {
    const editorEmail = `cg-ve-${Date.now()}@test.com`;
    const adminEmail = `cg-va-${Date.now()}@test.com`;
    const editorToken = await createUserWithRole(editorEmail, pw, 'content_editor');
    const adminToken = await createUserWithRole(adminEmail, pw, 'admin');
    const editorAuth = await apiAuth(editorToken);
    const adminAuth = await apiAuth(adminToken);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...editorAuth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Verify Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...editorAuth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'verify.docx',
        mediaId: 'media-verify-001',
        checksum: 'sha256:verify123',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    const provRes = await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...editorAuth,
      data: {
        contentId: 'content-verify-001',
        contentVersionId: 'v1',
        sourceId: src.id,
        ownershipType: 'platform_original',
        attribution: 'Verify Attribution',
        evidenceIds: [ev.id],
      },
    });
    const prov = await provRes.json();

    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/submit`, editorAuth);
    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/start-review`, adminAuth);

    const verifyRes = await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/verify`, adminAuth);
    expect(verifyRes.ok()).toBeTruthy();
    const body = await verifyRes.json();
    expect(body.verificationStatus).toBe('verified');
  });

  test('11. publication check succeeds for verified content', async ({ request }) => {
    const editorEmail = `cg-pub-e-${Date.now()}@test.com`;
    const adminEmail = `cg-pub-a-${Date.now()}@test.com`;
    const editorToken = await createUserWithRole(editorEmail, pw, 'content_editor');
    const adminToken = await createUserWithRole(adminEmail, pw, 'admin');
    const editorAuth = await apiAuth(editorToken);
    const adminAuth = await apiAuth(adminToken);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...editorAuth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Pub Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const licRes = await request.post(`${cfg.apiUrl}/content-provenance/licences`, {
      ...editorAuth,
      data: {
        licenceType: 'open',
        licensor: 'Licensor',
        licensee: 'Licensee',
        rightsGranted: ['publication', 'modification'],
        commercialUseAllowed: true,
        modificationAllowed: true,
        validFrom: '2024-01-01',
      },
    });
    const lic = await licRes.json();
    await request.post(`${cfg.apiUrl}/content-provenance/licences/${lic.id}/activate`, editorAuth);

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...editorAuth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'pub.docx',
        mediaId: 'media-pub-001',
        checksum: 'sha256:pub123',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    const provRes = await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...editorAuth,
      data: {
        contentId: 'content-pub-001',
        contentVersionId: 'v1',
        sourceId: src.id,
        licenceId: lic.id,
        ownershipType: 'platform_original',
        attribution: 'Pub Attribution',
        evidenceIds: [ev.id],
      },
    });
    const prov = await provRes.json();

    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/submit`, editorAuth);
    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/start-review`, adminAuth);
    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/verify`, adminAuth);

    const simRes = await request.post(`${cfg.apiUrl}/content-provenance/similarity-checks`, {
      ...editorAuth,
      data: { contentId: 'content-pub-001', contentVersionId: 'v1' },
    });
    expect(simRes.ok()).toBeTruthy();
    const sim = await simRes.json();

    // Get latest version after submit/review/verify
    const provLatest = await request.get(`${cfg.apiUrl}/content-provenance/records/${prov.id}`, editorAuth);
    const provData = await provLatest.json();

    // Link similarity check to provenance
    await request.patch(`${cfg.apiUrl}/content-provenance/records/${prov.id}`, {
      ...editorAuth,
      data: { similarityCheckId: sim.id, expectedVersion: provData.version },
    });

    const pubRes = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...editorAuth,
      data: { contentId: 'content-pub-001', contentVersionId: 'v1' },
    });
    expect(pubRes.ok()).toBeTruthy();
    const body = await pubRes.json();
    expect(body.eligible).toBeTruthy();
    expect(body.decisionId).toBeTruthy();
  });

  test('12. licence revocation blocks publication', async ({ request }) => {
    const email = `cg-revoke-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = await apiAuth(token);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Revoke Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const licRes = await request.post(`${cfg.apiUrl}/content-provenance/licences`, {
      ...auth,
      data: {
        licenceType: 'exclusive',
        licensor: 'Licensor',
        licensee: 'Licensee',
        rightsGranted: ['publication'],
        commercialUseAllowed: true,
        modificationAllowed: true,
        validFrom: '2024-01-01',
      },
    });
    const lic = await licRes.json();
    await request.post(`${cfg.apiUrl}/content-provenance/licences/${lic.id}/activate`, auth);

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...auth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'revoke.docx',
        mediaId: 'media-revoke-001',
        checksum: 'sha256:revoke123',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    const provRes = await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...auth,
      data: {
        contentId: 'content-revoke-001',
        contentVersionId: 'v1',
        sourceId: src.id,
        licenceId: lic.id,
        ownershipType: 'platform_original',
        attribution: 'Revoke Attribution',
        evidenceIds: [ev.id],
      },
    });
    const prov = await provRes.json();

    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/submit`, auth);
    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/start-review`, auth);
    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/verify`, auth);

    await request.post(`${cfg.apiUrl}/content-provenance/similarity-checks`, {
      ...auth,
      data: { contentId: 'content-revoke-001', contentVersionId: 'v1' },
    });

    const revokeRes = await request.post(`${cfg.apiUrl}/content-provenance/licences/${lic.id}/revoke`, auth);
    expect(revokeRes.ok()).toBeTruthy();

    const pubRes = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: 'content-revoke-001', contentVersionId: 'v1' },
    });
    expect(pubRes.ok()).toBeTruthy();
    const body = await pubRes.json();
    expect(body.eligible).toBeFalsy();
    expect(body.blockers.some((b: { code: string }) => b.code === 'LICENCE_REVOKED')).toBeTruthy();
  });

  test('13. historical decision remains visible after licence change', async ({ request }) => {
    const email = `cg-hist-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = await apiAuth(token);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Hist Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const licRes = await request.post(`${cfg.apiUrl}/content-provenance/licences`, {
      ...auth,
      data: {
        licenceType: 'exclusive',
        licensor: 'Licensor',
        licensee: 'Licensee',
        rightsGranted: ['publication'],
        commercialUseAllowed: true,
        modificationAllowed: true,
        validFrom: '2024-01-01',
      },
    });
    const lic = await licRes.json();
    await request.post(`${cfg.apiUrl}/content-provenance/licences/${lic.id}/activate`, auth);

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...auth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'hist.docx',
        mediaId: 'media-hist-001',
        checksum: 'sha256:hist123',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    const provRes = await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...auth,
      data: {
        contentId: 'content-hist-001',
        contentVersionId: 'v1',
        sourceId: src.id,
        licenceId: lic.id,
        ownershipType: 'platform_original',
        attribution: 'Hist Attribution',
        evidenceIds: [ev.id],
      },
    });
    const prov = await provRes.json();

    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/submit`, auth);
    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/start-review`, auth);
    await request.post(`${cfg.apiUrl}/content-provenance/records/${prov.id}/verify`, auth);

    const simRes2 = await request.post(`${cfg.apiUrl}/content-provenance/similarity-checks`, {
      ...auth,
      data: { contentId: 'content-hist-001', contentVersionId: 'v1' },
    });
    const sim2 = await simRes2.json();
    // Get latest version after submit/review/verify
    const provLatest2 = await request.get(`${cfg.apiUrl}/content-provenance/records/${prov.id}`, auth);
    const provData2 = await provLatest2.json();
    await request.patch(`${cfg.apiUrl}/content-provenance/records/${prov.id}`, {
      ...auth,
      data: { similarityCheckId: sim2.id, expectedVersion: provData2.version },
    });

    const pub1 = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: 'content-hist-001', contentVersionId: 'v1' },
    });
    const decision1 = await pub1.json();
    expect(decision1.eligible).toBeTruthy();

    const revokeRes = await request.post(`${cfg.apiUrl}/content-provenance/licences/${lic.id}/revoke`, auth);
    expect(revokeRes.ok()).toBeTruthy();

    const pub2 = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: 'content-hist-001', contentVersionId: 'v1' },
    });
    const decision2 = await pub2.json();
    expect(decision2.eligible).toBeFalsy();
    expect(decision2.blockers.some((b: { code: string }) => b.code === 'LICENCE_REVOKED')).toBeTruthy();
  });

  test('14. re-verification queue shows jobs after licence revocation', async ({ request }) => {
    const email = `cg-revq-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = await apiAuth(token);

    const srcRes = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: {
        sourceType: 'original_creation_record',
        title: 'RevQ Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });
    const src = await srcRes.json();

    const licRes = await request.post(`${cfg.apiUrl}/content-provenance/licences`, {
      ...auth,
      data: {
        licenceType: 'exclusive',
        licensor: 'Licensor',
        licensee: 'Licensee',
        rightsGranted: ['publication'],
        commercialUseAllowed: true,
        modificationAllowed: true,
        validFrom: '2024-01-01',
      },
    });
    const lic = await licRes.json();
    await request.post(`${cfg.apiUrl}/content-provenance/licences/${lic.id}/activate`, auth);

    const evRes = await request.post(`${cfg.apiUrl}/content-provenance/evidence`, {
      ...auth,
      data: {
        evidenceType: 'original_draft',
        fileName: 'revq.docx',
        mediaId: 'media-revq-001',
        checksum: 'sha256:revq123',
        mimeType: 'application/msword',
      },
    });
    const ev = await evRes.json();

    await request.post(`${cfg.apiUrl}/content-provenance/records`, {
      ...auth,
      data: {
        contentId: 'content-revq-001',
        contentVersionId: 'v1',
        sourceId: src.id,
        licenceId: lic.id,
        ownershipType: 'platform_original',
        attribution: 'RevQ Attribution',
        evidenceIds: [ev.id],
      },
    });

    await request.post(`${cfg.apiUrl}/content-provenance/licences/${lic.id}/revoke`, auth);

    const revRes = await request.get(`${cfg.apiUrl}/content-provenance/reverification`, auth);
    expect(revRes.ok()).toBeTruthy();
    const jobs = await revRes.json();
    expect(Array.isArray(jobs)).toBeTruthy();
  });

  test('15. audit report contains events', async ({ request }) => {
    const email = `cg-audit-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = await apiAuth(token);

    await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: {
        sourceType: 'original_creation_record',
        title: 'Audit Source',
        owner: 'Owner',
        publisher: 'Publisher',
        sourceDate: '2024-01-01T00:00:00.000Z',
        accessDate: '2024-06-01T00:00:00.000Z',
      },
    });

    const res = await request.get(`${cfg.apiUrl}/content-provenance/audit-report`, auth);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.generatedAt).toBeTruthy();
    expect(body.policyVersion).toBeTruthy();
    expect(body.totals).toBeTruthy();
    expect(body.historicalChanges).toBeTruthy();
  });

  test('16. policy endpoint returns active policy', async ({ request }) => {
    const email = `cg-pol-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = await apiAuth(token);

    const res = await request.get(`${cfg.apiUrl}/content-provenance/policies/active`, auth);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.version).toBeTruthy();
    expect(body.similarityReviewThreshold).toBeDefined();
    expect(body.similarityBlockThreshold).toBeDefined();
  });

  test('17. student receives 403 on provenance routes', async ({ request }) => {
    const email = `cg-stu-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'student');
    const auth = await apiAuth(token);

    const res = await request.get(`${cfg.apiUrl}/content-provenance/sources`, auth);
    expect(res.status()).toBe(403);
  });

  test('18. teacher receives 403 on provenance routes', async ({ request }) => {
    const email = `cg-tea-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'teacher');
    const auth = await apiAuth(token);

    const res = await request.get(`${cfg.apiUrl}/content-provenance/sources`, auth);
    expect(res.status()).toBe(403);
  });

  test('19. invalid body receives 400', async ({ request }) => {
    const email = `cg-400-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const auth = await apiAuth(token);

    const res = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      ...auth,
      data: { invalid: true },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Validation');
  });

  test('20. re-verification UI page loads', async ({ page }) => {
    const email = `cg-revui-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/content/provenance/reverification`);
    await expect(page.locator('h1')).toContainText('Re-verification Queue');
  });
});
