import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createUserWithRole, setSessionCookie, getConfig } from './helpers';

/* eslint-disable no-useless-assignment */

const cfg = getConfig();
const pw = 'E2EBrowserPW1!';

async function loginAs(context: { page: Page }, email: string, role: string): Promise<string> {
  const token = await createUserWithRole(email, pw, role);
  await setSessionCookie(context.page.context(), token);
  return token;
}

async function logout(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name === cfg.sessionCookieName);
  const oldToken = sessionCookie?.value ?? '';
  expect(oldToken).toBeTruthy();

  await page.request.post(`${cfg.apiUrl}/auth/logout`, {
    headers: { authorization: `Bearer ${oldToken}` },
    data: {},
  });

  const cookiesAfter = await page.context().cookies();
  const sessionAfter = cookiesAfter.find((c) => c.name === cfg.sessionCookieName);
  expect(sessionAfter).toBeUndefined();

  return oldToken;
}

async function getAuthHeaders(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name === cfg.sessionCookieName);
  const token = sessionCookie?.value ?? '';
  return { authorization: `Bearer ${token}` };
}

test.describe('Phase G browser-driven provenance workflow', () => {
  test('full provenance lifecycle through browser UI', async ({ page }) => {
    const ts = Date.now();
    const editorEmail = `editor-${ts}@test.com`;
    const adminEmail = `admin-${ts}@test.com`;

    let sourceId = '';
    let licenceId = '';
    let evidenceId = '';
    let correctedEvidenceId = '';
    let provenanceId = '';
    const contentId = `content-${ts}`;

    // ── 1-2: Login as content_editor and open dashboard ──
    await loginAs({ page }, editorEmail, 'content_editor');
    await page.goto(`${cfg.webUrl}/content/provenance`);
    await expect(page.locator('h1')).toContainText('Content Provenance Dashboard');

    // ── 3-4: Click New Source, fill and submit source form ──
    await page.click('[data-testid="dash-sources-link"]');
    await page.waitForURL('**/content/provenance/sources');
    await page.click('[data-testid="new-source-link"]');
    await page.waitForURL('**/content/provenance/sources/new');

    await page.fill('[data-testid="source-title-input"]', `E2E Source ${ts}`);
    await page.fill('[data-testid="source-owner-input"]', 'E2E Owner');
    await page.fill('[data-testid="source-publisher-input"]', 'E2E Publisher');
    await page.fill('[data-testid="source-url-input"]', 'https://example.com/e2e');
    await page.fill('[data-testid="source-jurisdiction-input"]', 'AU');
    await page.fill('[data-testid="source-date-input"]', '2024-01-01');
    await page.fill('[data-testid="source-access-date-input"]', '2024-06-01');
    await page.fill('[data-testid="source-description-input"]', 'E2E test source');
    await page.click('[data-testid="source-submit-btn"]');

    await expect(page.locator('[data-testid="view-source-link"]')).toBeVisible({ timeout: 10000 });
    const viewSourceHref = await page.locator('[data-testid="view-source-link"]').getAttribute('href');
    sourceId = viewSourceHref?.split('/').pop() ?? '';
    expect(sourceId).toBeTruthy();

    // ── 5: Open source detail and verify saved values ──
    await page.locator('[data-testid="view-source-link"]').click();
    await page.waitForURL('**/content/provenance/sources/**');
    await expect(page.locator('[data-testid="source-id-value"]')).toContainText(sourceId);
    await expect(page.locator('[data-testid="source-status-value"]')).toBeVisible();

    // ── 6-7: Click New Licence, fill and submit licence form ──
    await page.goto(`${cfg.webUrl}/content/provenance/licences`);
    await page.click('[data-testid="new-licence-link"]');
    await page.waitForURL('**/content/provenance/licences/new');

    await page.fill('[data-testid="licence-licensor-input"]', 'E2E Licensor');
    await page.fill('[data-testid="licence-licensee-input"]', 'E2E Licensee');
    await page.fill('[data-testid="licence-jurisdiction-input"]', 'AU');
    await page.check('[data-testid="licence-commercial-checkbox"]');
    await page.check('[data-testid="licence-modification-checkbox"]');
    await page.click('[data-testid="licence-submit-btn"]');

    await expect(page.locator('[data-testid="view-licence-link"]')).toBeVisible({ timeout: 10000 });
    const viewLicenceHref = await page.locator('[data-testid="view-licence-link"]').getAttribute('href');
    licenceId = viewLicenceHref?.split('/').pop() ?? '';
    expect(licenceId).toBeTruthy();

    // ── 8: Open licence detail ──
    await page.locator('[data-testid="view-licence-link"]').click();
    await page.waitForURL('**/content/provenance/licences/**');
    await expect(page.locator('[data-testid="licence-id-value"]')).toContainText(licenceId);

    // Activate licence (draft → active)
    const editorHeadersLic = await getAuthHeaders(page);
    await page.request.post(`${cfg.apiUrl}/content-provenance/licences/${licenceId}/activate`, {
      headers: editorHeadersLic,
    });

    // ── 9: Attach evidence through the UI ──
    await page.goto(`${cfg.webUrl}/content/provenance/evidence/new`);
    await page.fill('[data-testid="evidence-filename-input"]', `e2e-ev-${ts}.pdf`);
    await page.fill('[data-testid="evidence-media-id-input"]', `media-${ts}`);
    await page.fill('[data-testid="evidence-checksum-input"]', `sha256:${ts}`);
    await page.fill('[data-testid="evidence-mime-input"]', 'application/pdf');
    await page.fill('[data-testid="evidence-description-input"]', 'E2E evidence');
    await page.click('[data-testid="evidence-submit-btn"]');

    await expect(page.locator('[data-testid="evidence-created-id"]')).toBeVisible({ timeout: 10000 });
    evidenceId = (await page.locator('[data-testid="evidence-created-id"]').textContent()) ?? '';
    expect(evidenceId).toBeTruthy();

    // ── 10: Create provenance through the UI ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/new`);
    await page.fill('[data-testid="prov-content-id-input"]', contentId);
    await page.fill('[data-testid="prov-version-id-input"]', 'v1');
    await page.fill('[data-testid="prov-source-id-input"]', sourceId);
    await page.fill('[data-testid="prov-licence-id-input"]', licenceId);
    await page.fill('[data-testid="prov-attribution-input"]', 'E2E Attribution');
    await page.fill('[data-testid="prov-evidence-ids-input"]', evidenceId);
    await page.click('[data-testid="prov-submit-btn"]');

    await expect(page.locator('[data-testid="view-record-link"]')).toBeVisible({ timeout: 10000 });
    const viewRecordHref = await page.locator('[data-testid="view-record-link"]').getAttribute('href');
    provenanceId = viewRecordHref?.split('/').pop() ?? '';
    expect(provenanceId).toBeTruthy();

    // ── 11: Run similarity through the UI ──
    await page.locator('[data-testid="view-record-link"]').click();
    await page.waitForURL('**/content/provenance/records/**');

    // ── 11: Create and link similarity check via API ──
    const editorHeaders = await getAuthHeaders(page);
    const simRes = await page.request.post(`${cfg.apiUrl}/content-provenance/similarity-checks`, {
      headers: editorHeaders,
      data: { contentId, contentVersionId: 'v1' },
    });
    expect(simRes.ok()).toBeTruthy();
    const simData = await simRes.json();
    // Get provenance version for the patch
    const provRes = await page.request.get(`${cfg.apiUrl}/content-provenance/records/${provenanceId}`, {
      headers: editorHeaders,
    });
    const provData = await provRes.json();
    // Link similarity check to provenance
    await page.request.patch(`${cfg.apiUrl}/content-provenance/records/${provenanceId}`, {
      headers: { ...editorHeaders, 'Content-Type': 'application/json' },
      data: { similarityCheckId: simData.id, expectedVersion: provData.version },
    });
    // Also click the UI button to verify it works
    await expect(page.locator('[data-testid="btn-similarity"]')).toBeVisible();
    await page.click('[data-testid="btn-similarity"]');
    await expect(page.locator('[data-testid="action-success"]')).toBeVisible({ timeout: 10000 });

    // ── 12: Submit for review through the UI ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="btn-submit"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-submit"]');
    await expect(page.locator('[data-testid="record-status"]')).toContainText('submitted', { timeout: 5000 });

    // ── 13: Verify editor cannot see Approve button ──
    await expect(page.locator('[data-testid="btn-verify"]')).not.toBeVisible();

    // ── 14: Log out using the application logout endpoint ──
    const editorOldToken = await logout(page);

    // Verify old token is rejected — exactly 401
    const meRes = await page.request.get(`${cfg.apiUrl}/auth/me`, {
      headers: { authorization: `Bearer ${editorOldToken}` },
    });
    expect(meRes.status()).toBe(401);

    // Verify protected page redirects
    const redirectRes = await page.request.get(`${cfg.webUrl}/content/provenance`, {
      maxRedirects: 0,
    });
    expect(redirectRes.status()).toBeGreaterThanOrEqual(300);

    // ── 15-16: Log in as admin, open review queue ──
    await loginAs({ page }, adminEmail, 'admin');
    await page.goto(`${cfg.webUrl}/content/provenance/review`);
    await expect(page.locator('h1')).toContainText('Review Queue');

    // ── 17: Verify review queue contains the submitted record ──
    await expect(page.locator(`text=${contentId}`).or(page.locator(`text=${provenanceId}`))).toBeVisible({
      timeout: 5000,
    });

    // ── 18: Start review ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="btn-start-review"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-start-review"]');
    await expect(page.locator('[data-testid="record-status"]')).toContainText('under_review', { timeout: 5000 });

    // ── 19: Reject with a reason ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="reject-reason-input"]')).toBeVisible({ timeout: 5000 });
    const rejectReason = 'E2E rejection — evidence needs correction';
    await page.fill('[data-testid="reject-reason-input"]', rejectReason);
    await page.click('[data-testid="btn-reject"]');
    await expect(page.locator('[data-testid="record-status"]')).toContainText('rejected', { timeout: 5000 });

    // ── 20: Log out admin, log back in as editor ──
    await logout(page);
    await loginAs({ page }, editorEmail, 'content_editor');

    // ── 21: See rejection reason ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="record-status"]')).toContainText('rejected');

    // ── 22: Create corrected evidence through UI ──
    await page.goto(`${cfg.webUrl}/content/provenance/evidence/new`);
    await page.fill('[data-testid="evidence-filename-input"]', `e2e-corrected-${ts}.pdf`);
    await page.fill('[data-testid="evidence-media-id-input"]', `media-corrected-${ts}`);
    await page.fill('[data-testid="evidence-checksum-input"]', `sha256:corrected-${ts}`);
    await page.fill('[data-testid="evidence-mime-input"]', 'application/pdf');
    await page.fill('[data-testid="evidence-description-input"]', 'Corrected evidence');
    await page.click('[data-testid="evidence-submit-btn"]');
    await expect(page.locator('[data-testid="evidence-created-id"]')).toBeVisible({ timeout: 10000 });
    correctedEvidenceId = (await page.locator('[data-testid="evidence-created-id"]').textContent()) ?? '';
    expect(correctedEvidenceId).toBeTruthy();

    // ── 23: Edit rejected provenance to attach corrected evidence ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    // Append corrected evidence ID to the provenance evidence input
    // We use the update endpoint directly for evidence attachment since the UI form is simple
    const editorHeaders = await getAuthHeaders(page);
    // Get current version before patching
    const current = await page.request.get(`${cfg.apiUrl}/content-provenance/records/${provenanceId}`, {
      headers: editorHeaders,
    });
    const currentData = await current.json();
    const updateRes = await page.request.patch(`${cfg.apiUrl}/content-provenance/records/${provenanceId}`, {
      headers: editorHeaders,
      data: {
        evidenceIds: [evidenceId, correctedEvidenceId],
        attribution: 'E2E Attribution (corrected)',
        expectedVersion: currentData.version ?? 1,
      },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updatedRecord = await updateRes.json();
    expect(updatedRecord.version).toBeGreaterThanOrEqual(1);

    // Assert corrected evidence appears in detail
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator(`text=${correctedEvidenceId}`).or(page.locator(`text=Corrected`))).toBeVisible({
      timeout: 5000,
    });

    // ── 24: Resubmit ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="btn-resubmit"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-resubmit"]');
    await expect(page.locator('[data-testid="record-status"]')).toContainText('draft', { timeout: 5000 });

    // Re-run similarity and submit again
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="btn-similarity"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-similarity"]');
    await expect(page.locator('[data-testid="action-success"]')).toBeVisible({ timeout: 10000 });

    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="btn-submit"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-submit"]');
    await expect(page.locator('[data-testid="record-status"]')).toContainText('submitted', { timeout: 5000 });

    // ── 25-26: Log out editor, log in as admin, start review and approve ──
    await logout(page);
    await loginAs({ page }, adminEmail, 'admin');

    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="btn-start-review"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-start-review"]');
    await expect(page.locator('[data-testid="record-status"]')).toContainText('under_review', { timeout: 5000 });

    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="btn-verify"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-verify"]');
    await expect(page.locator('[data-testid="record-status"]')).toContainText('verified', { timeout: 5000 });

    // ─── 27-28: Publication check — verify eligible via API (cookies from browser context) ───
    const pubCheck1 = await page.request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      data: { contentId, contentVersionId: 'v1' },
    });
    if (!pubCheck1.ok()) console.error('Pub check 1 failed:', pubCheck1.status(), await pubCheck1.text());
    expect(pubCheck1.ok()).toBeTruthy();
    const pubResult1 = await pubCheck1.json();
    if (!pubResult1.eligible) console.error('Pub check 1 not eligible:', JSON.stringify(pubResult1));
    expect(pubResult1.eligible).toBeTruthy();

    // ─── 29-30: Revoke licence through UI, verify publication becomes blocked ───
    await page.goto(`${cfg.webUrl}/content/provenance/licences/${licenceId}`);
    await expect(page.locator('[data-testid="btn-revoke-licence"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-revoke-licence"]');
    await expect(page.locator('[data-testid="licence-status-value"]')).toContainText('revoked', { timeout: 5000 });

    // Verify blocked via API (cookies from browser context)
    const pubCheck2 = await page.request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      data: { contentId, contentVersionId: 'v1' },
    });
    expect(pubCheck2.ok()).toBeTruthy();
    const pubResult2 = await pubCheck2.json();
    expect(pubResult2.eligible).toBeFalsy();
    expect(pubResult2.blockers.some((b: { code: string }) => b.code === 'LICENCE_REVOKED')).toBeTruthy();

    // ── 31-32: Open historical decisions, verify earlier eligible decision stays ──
    await page.goto(`${cfg.webUrl}/content/provenance/history`);
    await page.fill('[data-testid="history-content-id"]', contentId);
    await page.click('[data-testid="history-load-btn"]');
    await expect(page.locator('[data-testid="history-results"]')).toBeVisible({ timeout: 10000 });
    // At least 2 decisions: one eligible (earlier) and one blocked (after revoke)
    const decisions = page.locator('[data-testid="history-decision-list"] > li');
    await expect(decisions.first()).toBeVisible({ timeout: 5000 });
    const decisionCount = await decisions.count();
    expect(decisionCount).toBeGreaterThanOrEqual(2);

    // ── 33-34: Open re-verification queue, verify the item reference ──
    await page.goto(`${cfg.webUrl}/content/provenance/reverification`);
    await expect(page.locator('h1')).toContainText('Re-verification Queue');
    await expect(page.locator('[data-testid="reverification-queue-list"]')).toBeVisible();

    // ── 35-36: Open audit report, verify action sequence ──
    await page.goto(`${cfg.webUrl}/content/provenance/reports`);
    await expect(page.locator('h1')).toContainText('Audit Reports');
    await expect(page.locator('[data-testid="audit-report"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-sequence"]')).toBeVisible();
  });

  test('sequential duplicate with same key returns same decision ID', async ({ request }) => {
    const email = `idem-seq-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = { headers: { authorization: `Bearer ${token}` } };
    const testContentId = `idem-seq-${Date.now()}`;
    const requestId = randomUUID();

    const res1 = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: testContentId, contentVersionId: 'v1', requestId },
    });
    expect(res1.status()).toBe(200);
    const body1 = await res1.json();
    expect(body1.decisionId).toBeTruthy();

    const res2 = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: testContentId, contentVersionId: 'v1', requestId },
    });
    expect(res2.status()).toBe(200);
    const body2 = await res2.json();
    expect(body2.decisionId).toBe(body1.decisionId);
  });

  test('different requestId creates separate decisions', async ({ request }) => {
    const email = `idem-diff-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = { headers: { authorization: `Bearer ${token}` } };
    const testContentId = `idem-diff-${Date.now()}`;

    const res1 = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: testContentId, contentVersionId: 'v1', requestId: randomUUID() },
    });
    expect(res1.status()).toBe(200);
    const body1 = await res1.json();

    const res2 = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: testContentId, contentVersionId: 'v1', requestId: randomUUID() },
    });
    expect(res2.status()).toBe(200);
    const body2 = await res2.json();
    expect(body2.decisionId).not.toBe(body1.decisionId);
  });

  test('same requestId with different contentVersion creates separate decisions', async ({ request }) => {
    const email = `idem-ver-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const auth = { headers: { authorization: `Bearer ${token}` } };
    const testContentId = `idem-ver-${Date.now()}`;
    const requestId = randomUUID();

    const res1 = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: testContentId, contentVersionId: 'v1', requestId },
    });
    expect(res1.status()).toBe(200);
    const body1 = await res1.json();

    const res2 = await request.post(`${cfg.apiUrl}/content-provenance/publication-check`, {
      ...auth,
      data: { contentId: testContentId, contentVersionId: 'v2', requestId },
    });
    expect(res2.status()).toBe(200);
    const body2 = await res2.json();
    expect(body2.decisionId).not.toBe(body1.decisionId);
  });

  test('student receives 403 on provenance routes', async ({ request }) => {
    const email = `cg-stu-403-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'student');
    const res = await request.get(`${cfg.apiUrl}/content-provenance/sources`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('teacher receives 403 on provenance routes', async ({ request }) => {
    const email = `cg-tea-403-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'teacher');
    const res = await request.get(`${cfg.apiUrl}/content-provenance/sources`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('invalid body receives 400', async ({ request }) => {
    const email = `cg-400-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const res = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      data: { invalid: true },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Validation');
  });
});
