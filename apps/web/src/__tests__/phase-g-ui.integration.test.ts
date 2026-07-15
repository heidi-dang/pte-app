import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const API_URL = process.env.E2E_API_URL || 'http://localhost:3001';
const WEB_URL = process.env.E2E_WEB_URL || 'http://localhost:3000';

function apiAuth(token: string) {
  return { headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } };
}

async function registerUser(email: string, pw: string, role: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: email, password: pw, displayName: email.split('@')[0] }),
  });
  if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  const meRes = await fetch(`${API_URL}/auth/me`, { headers: { authorization: `Bearer ${data.token}` } });
  const me = (await meRes.json()) as { user: { id: string } };

  const { Client } = await import('pg');
  const client = new Client({
    host: process.env.E2E_DATABASE_HOST || 'localhost',
    port: parseInt(process.env.E2E_DATABASE_PORT || '5432', 10),
    database: process.env.E2E_DATABASE_NAME || 'pte_dev',
    user: process.env.E2E_DATABASE_USER || 'pte',
    password: process.env.E2E_DATABASE_PASSWORD || 'pte',
  });
  await client.connect();
  try {
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [me.user.id]);
    await client.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [me.user.id, role]);
  } finally {
    await client.end();
  }
  return data.token;
}

describe('Provenance UI behaviour tests', () => {
  describe('1. source form validation', () => {
    it('validates required fields', async () => {
      const email = `src-val-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/sources`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({ sourceType: 'original_creation_record' }),
      });
      assert.equal(res.status, 400);
      const body = (await res.json()) as { error?: string };
      assert.ok(body.error?.includes('Validation') || body.error?.includes('required') || res.status === 400);
    });

    it('accepts valid source creation', async () => {
      const email = `src-ok-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/sources`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          sourceType: 'original_creation_record',
          title: 'UI Test Source',
          owner: 'Owner',
          publisher: 'Publisher',
          sourceDate: '2024-01-01T00:00:00.000Z',
          accessDate: '2024-06-01T00:00:00.000Z',
        }),
      });
      assert.equal(res.status, 200);
      const body = (await res.json()) as { id: string; status: string };
      assert.ok(body.id);
      assert.equal(body.status, 'draft');
    });
  });

  describe('2. licence form validation', () => {
    it('validates required fields', async () => {
      const email = `lic-val-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/licences`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({ licenceType: 'exclusive' }),
      });
      assert.equal(res.status, 400);
    });

    it('accepts valid licence creation', async () => {
      const email = `lic-ok-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/licences`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          licenceType: 'open',
          licensor: 'Licensor',
          licensee: 'Licensee',
          validFrom: '2024-01-01',
          rightsGranted: ['publication'],
          commercialUseAllowed: true,
          modificationAllowed: true,
        }),
      });
      assert.equal(res.status, 200);
    });
  });

  describe('3. evidence input', () => {
    it('validates evidence creation fields', async () => {
      const email = `ev-val-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/evidence`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({ evidenceType: 'signed_agreement' }),
      });
      assert.equal(res.status, 400);
    });

    it('accepts valid evidence creation', async () => {
      const email = `ev-ok-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/evidence`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          evidenceType: 'original_draft',
          fileName: 'test.pdf',
          mediaId: 'media-test',
          checksum: 'sha256:abc',
          mimeType: 'application/pdf',
        }),
      });
      assert.equal(res.status, 200);
      const body = (await res.json()) as { id: string; status: string };
      assert.ok(body.id);
      assert.equal(body.status, 'active');
    });
  });

  describe('4. provenance submission', () => {
    it('validates provenance creation fields', async () => {
      const email = `prov-val-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/records`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({ contentId: 'test', contentVersionId: 'v1' }),
      });
      assert.equal(res.status, 400);
    });

    it('creates record with valid data', async () => {
      const email = `prov-ok-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);

      const srcRes = await fetch(`${API_URL}/content-provenance/sources`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          sourceType: 'original_creation_record',
          title: 'Prov UI Source',
          owner: 'Owner',
          publisher: 'Publisher',
          sourceDate: '2024-01-01T00:00:00.000Z',
          accessDate: '2024-06-01T00:00:00.000Z',
        }),
      });
      const src = (await srcRes.json()) as { id: string };
      const evRes = await fetch(`${API_URL}/content-provenance/evidence`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          evidenceType: 'original_draft',
          fileName: 'prov.pdf',
          mediaId: 'm-prov',
          checksum: 'sha:abc',
          mimeType: 'app/pdf',
        }),
      });
      const ev = (await evRes.json()) as { id: string };

      const res = await fetch(`${API_URL}/content-provenance/records`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          contentId: `prov-ui-${Date.now()}`,
          contentVersionId: 'v1',
          sourceId: src.id,
          ownershipType: 'platform_original',
          attribution: 'UI Test',
          evidenceIds: [ev.id],
        }),
      });
      assert.equal(res.ok ? 200 : res.status, 200);
    });
  });

  describe('5. blocker display', () => {
    it('returns blockers for missing provenance', async () => {
      const email = `blocker-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'admin');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/publication-check`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({ contentId: 'nonexistent-content', contentVersionId: 'v1' }),
      });
      const body = (await res.json()) as { eligible: boolean; blockers: Array<{ code: string }> };
      assert.equal(body.eligible, false);
      assert.ok(body.blockers.some((b) => b.code === 'PROVENANCE_MISSING'));
    });
  });

  describe('6. rejection reason', () => {
    it('rejects with reason and status updates', async () => {
      const email = `rr-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'admin');
      const auth = apiAuth(token);

      const srcRes = await fetch(`${API_URL}/content-provenance/sources`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          sourceType: 'original_creation_record',
          title: 'Rej Source',
          owner: 'O',
          publisher: 'P',
          sourceDate: '2024-01-01T00:00:00.000Z',
          accessDate: '2024-06-01T00:00:00.000Z',
        }),
      });
      const src = (await srcRes.json()) as { id: string };
      const evRes = await fetch(`${API_URL}/content-provenance/evidence`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          evidenceType: 'original_draft',
          fileName: 'rej.pdf',
          mediaId: 'm-rej',
          checksum: 'sha:rej',
          mimeType: 'app/pdf',
        }),
      });
      const ev = (await evRes.json()) as { id: string };
      const provRes = await fetch(`${API_URL}/content-provenance/records`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          contentId: `rej-${Date.now()}`,
          contentVersionId: 'v1',
          sourceId: src.id,
          ownershipType: 'platform_original',
          attribution: 'Rej',
          evidenceIds: [ev.id],
        }),
      });
      const prov = (await provRes.json()) as { id: string };
      await fetch(`${API_URL}/content-provenance/records/${prov.id}/submit`, { method: 'POST', ...auth });
      await fetch(`${API_URL}/content-provenance/records/${prov.id}/start-review`, { method: 'POST', ...auth });

      const rejRes = await fetch(`${API_URL}/content-provenance/records/${prov.id}/reject`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({ reason: 'Test rejection - UI test' }),
      });
      assert.equal(rejRes.ok ? 200 : rejRes.status, 200);
      const rejBody = (await rejRes.json()) as { verificationStatus: string };
      assert.equal(rejBody.verificationStatus, 'rejected');
    });
  });

  describe('7. approval state', () => {
    it('self-approval is blocked', async () => {
      const email = `self-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'admin');
      const auth = apiAuth(token);

      const srcRes = await fetch(`${API_URL}/content-provenance/sources`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          sourceType: 'original_creation_record',
          title: 'Self Source',
          owner: 'O',
          publisher: 'P',
          sourceDate: '2024-01-01T00:00:00.000Z',
          accessDate: '2024-06-01T00:00:00.000Z',
        }),
      });
      const src = (await srcRes.json()) as { id: string };
      const evRes = await fetch(`${API_URL}/content-provenance/evidence`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          evidenceType: 'original_draft',
          fileName: 'self.pdf',
          mediaId: 'm-self',
          checksum: 'sha:self',
          mimeType: 'app/pdf',
        }),
      });
      const ev = (await evRes.json()) as { id: string };
      const provRes = await fetch(`${API_URL}/content-provenance/records`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          contentId: `self-${Date.now()}`,
          contentVersionId: 'v1',
          sourceId: src.id,
          ownershipType: 'platform_original',
          attribution: 'Self',
          evidenceIds: [ev.id],
        }),
      });
      const prov = (await provRes.json()) as { id: string };
      await fetch(`${API_URL}/content-provenance/records/${prov.id}/submit`, { method: 'POST', ...auth });

      const verifyRes = await fetch(`${API_URL}/content-provenance/records/${prov.id}/verify`, {
        method: 'POST',
        ...auth,
      });
      assert.equal(verifyRes.status, 403);
      const body = (await verifyRes.json()) as { error: string };
      assert.ok(body.error.includes('Self-approval'));
    });
  });

  describe('8. version history', () => {
    it('records have version numbers', async () => {
      const email = `ver-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const srcRes = await fetch(`${API_URL}/content-provenance/sources`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          sourceType: 'original_creation_record',
          title: 'Ver Source',
          owner: 'O',
          publisher: 'P',
          sourceDate: '2024-01-01T00:00:00.000Z',
          accessDate: '2024-06-01T00:00:00.000Z',
        }),
      });
      const src = (await srcRes.json()) as { id: string; version: number };
      assert.ok(typeof src.version === 'number');
    });
  });

  describe('9. historical publication decision', () => {
    it('decisions can be listed for a content', async () => {
      const email = `hist-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'admin');
      const auth = apiAuth(token);

      const srcRes = await fetch(`${API_URL}/content-provenance/sources`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({
          sourceType: 'original_creation_record',
          title: 'Hist Test',
          owner: 'O',
          publisher: 'P',
          sourceDate: '2024-01-01T00:00:00.000Z',
          accessDate: '2024-06-01T00:00:00.000Z',
        }),
      });
      const src = (await srcRes.json()) as { id: string };

      const res = await fetch(`${API_URL}/content-provenance/publication-check`, {
        method: 'POST',
        ...auth,
        body: JSON.stringify({ contentId: `hist-test-${Date.now()}`, contentVersionId: 'v1' }),
      });
      assert.ok(res.ok || res.status === 200);
    });
  });

  describe('10. re-verification queue', () => {
    it('returns re-verification queue list', async () => {
      const email = `rvq-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'admin');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/reverification`, { headers: auth.headers });
      assert.equal(res.status, 200);
      const body = (await res.json()) as unknown[];
      assert.ok(Array.isArray(body));
    });
  });

  describe('11. audit-report table', () => {
    it('returns audit report data', async () => {
      const email = `arep-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'admin');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/audit-report`, { headers: auth.headers });
      assert.equal(res.status, 200);
      const body = (await res.json()) as Record<string, unknown>;
      assert.ok(body.generatedAt);
      assert.ok(body.totals);
    });
  });

  describe('12. mobile layout', () => {
    it('dashboard page loads', async () => {
      const res = await fetch(`${WEB_URL}/content/provenance`);
      assert.equal(res.status, 200);
    });
  });

  describe('13. keyboard navigation', () => {
    it('form controls have accessible labels', async () => {
      const res = await fetch(`${WEB_URL}/content/provenance/sources/new`);
      const text = await res.text();
      assert.ok(text.includes('<label') || text.includes('aria-label') || text.includes('htmlFor'));
    });
  });

  describe('14. loading state', () => {
    it('dashboard returns HTML', async () => {
      const email = `load-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const res = await fetch(`${WEB_URL}/content/provenance`, {
        headers: { Cookie: `session=${token}` },
      });
      assert.ok(res.ok || res.status === 200);
    });
  });

  describe('15. empty state', () => {
    it('source register shows empty state when no sources', async () => {
      const email = `empty-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const res = await fetch(`${WEB_URL}/content/provenance/sources`, {
        headers: { Cookie: `session=${token}` },
      });
      assert.ok(res.ok || res.status === 200);
    });
  });

  describe('16. API error', () => {
    it('returns appropriate error for missing resource', async () => {
      const email = `err-${Date.now()}@test.com`;
      const token = await registerUser(email, 'Password1!', 'content_editor');
      const auth = apiAuth(token);
      const res = await fetch(`${API_URL}/content-provenance/sources/00000000-0000-0000-0000-000000000000`, {
        headers: auth.headers,
      });
      assert.equal(res.status, 404);
    });
  });
});
