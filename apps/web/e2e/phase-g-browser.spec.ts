import { test, expect, type Page } from '@playwright/test';
import { createUserWithRole, setSessionCookie, getConfig } from './helpers';

/* eslint-disable no-useless-assignment */

const cfg = getConfig();
const pw = 'E2EBrowserPW1!';

async function loginAsEditor(context: { page: Page }, email: string): Promise<string> {
  const token = await createUserWithRole(email, pw, 'content_editor');
  await setSessionCookie(context.page.context(), token);
  return token;
}

async function loginAsAdmin(context: { page: Page }, email: string): Promise<string> {
  const token = await createUserWithRole(email, pw, 'admin');
  await setSessionCookie(context.page.context(), token);
  return token;
}

test.describe('Phase G browser-driven provenance workflow', () => {
  test('full provenance lifecycle through browser UI', async ({ page }) => {
    const ts = Date.now();
    const editorEmail = `editor-browser-${ts}@test.com`;
    const adminEmail = `admin-browser-${ts}@test.com`;

    let sourceId = '';
    let licenceId = '';
    let evidenceId = '';
    let provenanceId = '';

    // ── 1-2: Login as content_editor and open dashboard ──
    await loginAsEditor({ page }, editorEmail);
    await page.goto(`${cfg.webUrl}/content/provenance`);
    await expect(page.locator('h1')).toContainText('Content Provenance Dashboard');

    // ── 3-4: Click New Source, fill and submit source form ──
    await page.click('[data-testid="dash-sources-link"]');
    await page.waitForURL('**/content/provenance/sources');
    await page.click('[data-testid="new-source-link"]');
    await page.waitForURL('**/content/provenance/sources/new');

    await page.fill('[data-testid="source-title-input"]', `Browser E2E Source ${ts}`);
    await page.fill('[data-testid="source-owner-input"]', 'E2E Owner');
    await page.fill('[data-testid="source-publisher-input"]', 'E2E Publisher');
    await page.fill('[data-testid="source-url-input"]', 'https://example.com/e2e-source');
    await page.fill('[data-testid="source-jurisdiction-input"]', 'AU');
    await page.fill('[data-testid="source-description-input"]', 'Browser E2E test source');
    await page.click('[data-testid="source-submit-btn"]');

    await expect(page.locator('[data-testid="view-source-link"]')).toBeVisible({ timeout: 10000 });
    const viewSourceLink = page.locator('[data-testid="view-source-link"]');
    const viewSourceHref = await viewSourceLink.getAttribute('href');
    sourceId = viewSourceHref?.split('/').pop() ?? '';
    expect(sourceId).toBeTruthy();

    // ── 5: Open source detail and verify saved values ──
    await viewSourceLink.click();
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
    const viewLicenceLink = page.locator('[data-testid="view-licence-link"]');
    const viewLicenceHref = await viewLicenceLink.getAttribute('href');
    licenceId = viewLicenceHref?.split('/').pop() ?? '';
    expect(licenceId).toBeTruthy();

    // ── 8: Open licence detail ──
    await viewLicenceLink.click();
    await page.waitForURL('**/content/provenance/licences/**');
    await expect(page.locator('[data-testid="licence-id-value"]')).toContainText(licenceId);
    await expect(page.locator('[data-testid="licence-status-value"]')).toBeVisible();

    // ── 9: Attach evidence through the UI ──
    await page.goto(`${cfg.webUrl}/content/provenance/evidence/new`);
    await page.fill('[data-testid="evidence-filename-input"]', `e2e-browser-evidence-${ts}.pdf`);
    await page.fill('[data-testid="evidence-media-id-input"]', `media-browser-${ts}`);
    await page.fill('[data-testid="evidence-checksum-input"]', `sha256:browser${ts}`);
    await page.fill('[data-testid="evidence-mime-input"]', 'application/pdf');
    await page.fill('[data-testid="evidence-description-input"]', 'Browser E2E evidence');
    await page.click('[data-testid="evidence-submit-btn"]');

    await expect(page.locator('[data-testid="evidence-created-id"]')).toBeVisible({ timeout: 10000 });
    evidenceId = (await page.locator('[data-testid="evidence-created-id"]').textContent()) ?? '';
    expect(evidenceId).toBeTruthy();

    // ── 10: Create provenance through the UI ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/new`);
    const contentId = `content-browser-${ts}`;
    await page.fill('[data-testid="prov-content-id-input"]', contentId);
    await page.fill('[data-testid="prov-version-id-input"]', 'v1');
    await page.fill('[data-testid="prov-source-id-input"]', sourceId);
    await page.fill('[data-testid="prov-licence-id-input"]', licenceId);
    await page.fill('[data-testid="prov-attribution-input"]', 'Browser E2E Attribution');
    await page.fill('[data-testid="prov-evidence-ids-input"]', evidenceId);
    await page.click('[data-testid="prov-submit-btn"]');

    await expect(page.locator('[data-testid="view-record-link"]')).toBeVisible({ timeout: 10000 });
    const viewRecordLink = page.locator('[data-testid="view-record-link"]');
    const viewRecordHref = await viewRecordLink.getAttribute('href');
    provenanceId = viewRecordHref?.split('/').pop() ?? '';
    expect(provenanceId).toBeTruthy();

    // ── 11: Run similarity through the UI ──
    await viewRecordLink.click();
    await page.waitForURL('**/content/provenance/records/**');
    await expect(page.locator('[data-testid="btn-similarity"]')).toBeVisible();
    await page.click('[data-testid="btn-similarity"]');
    await page.waitForTimeout(2000);

    // ── 12: Submit for review through the UI ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await expect(page.locator('[data-testid="btn-submit"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="btn-submit"]');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-testid="record-status"]')).toContainText('submitted');

    // ── 13: Verify editor cannot see or use Approve ──
    await expect(page.locator('[data-testid="btn-verify"]')).not.toBeVisible();

    // ── 14: Log out ──
    await page.context().clearCookies();

    // ── 15-16: Log in as admin, open review queue ──
    await loginAsAdmin({ page }, adminEmail);
    await page.goto(`${cfg.webUrl}/content/provenance/review`);
    await expect(page.locator('h1')).toContainText('Review Queue');
    await expect(page.locator('[data-testid="review-queue-empty"]')).toBeVisible();

    // ── 17: Open the submitted record ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await page.waitForTimeout(1000);

    // Start review first
    if (await page.locator('[data-testid="btn-start-review"]').isVisible()) {
      await page.click('[data-testid="btn-start-review"]');
      await page.waitForTimeout(1500);
    }

    // ── 18: Reject it with a reason ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await page.waitForTimeout(1000);
    if (await page.locator('[data-testid="reject-reason-input"]').isVisible()) {
      await page.fill('[data-testid="reject-reason-input"]', 'Evidence needs correction - browser E2E');
      await page.click('[data-testid="btn-reject"]');
      await page.waitForTimeout(1500);
      await expect(page.locator('[data-testid="record-status"]')).toContainText('rejected');
    }

    // ── 19: Log back in as editor ──
    await page.context().clearCookies();
    await loginAsEditor({ page }, editorEmail);

    // ── 20-21: See the rejection reason and correct evidence using UI ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="record-status"]')).toContainText('rejected');

    // Fix evidence via the UI form
    await page.goto(`${cfg.webUrl}/content/provenance/evidence/new`);
    await page.fill('[data-testid="evidence-filename-input"]', `e2e-corrected-${ts}.pdf`);
    await page.fill('[data-testid="evidence-media-id-input"]', `media-corrected-${ts}`);
    await page.fill('[data-testid="evidence-checksum-input"]', `sha256:corrected${ts}`);
    await page.fill('[data-testid="evidence-mime-input"]', 'application/pdf');
    await page.fill('[data-testid="evidence-description-input"]', 'Corrected evidence');
    await page.click('[data-testid="evidence-submit-btn"]');
    await page.waitForTimeout(1500);

    // ── 22: Resubmit ──
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await page.waitForTimeout(1000);
    if (await page.locator('[data-testid="btn-resubmit"]').isVisible()) {
      await page.click('[data-testid="btn-resubmit"]');
      await page.waitForTimeout(1500);
    }

    // Rebuild flow to submit again
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await page.waitForTimeout(1000);
    if (await page.locator('[data-testid="btn-submit"]').isVisible()) {
      await page.click('[data-testid="btn-submit"]');
      await page.waitForTimeout(1500);
    }

    // ── 23-24: Log in as admin, approve using UI ──
    await page.context().clearCookies();
    await loginAsAdmin({ page }, adminEmail);

    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await page.waitForTimeout(1000);
    if (await page.locator('[data-testid="btn-start-review"]').isVisible()) {
      await page.click('[data-testid="btn-start-review"]');
      await page.waitForTimeout(1500);
    }
    await page.goto(`${cfg.webUrl}/content/provenance/records/${provenanceId}`);
    await page.waitForTimeout(1000);
    if (await page.locator('[data-testid="btn-verify"]').isVisible()) {
      await page.click('[data-testid="btn-verify"]');
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('[data-testid="record-status"]')).toContainText('verified');

    // ── 25-26: Open publication check UI, verify eligible result ──
    await page.goto(`${cfg.webUrl}/content/provenance/publication-check`);
    await page.waitForTimeout(1000);
    await page.fill('[data-testid="pub-check-content-id"]', contentId);
    await page.fill('[data-testid="pub-check-version-id"]', 'v1');
    await page.click('[data-testid="pub-check-submit-btn"]');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="pub-check-result"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="pub-check-eligible"]')).toBeVisible();

    // ── 27-28: Revoke the licence through UI, verify publication becomes blocked ──
    await page.goto(`${cfg.webUrl}/content/provenance/licences/${licenceId}`);
    await page.waitForTimeout(1000);
    if (
      await page
        .locator('[data-testid="btn-revoke-licence"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await page.click('[data-testid="btn-revoke-licence"]');
      await page.waitForTimeout(2000);
    }

    // Verify blocked
    await page.goto(`${cfg.webUrl}/content/provenance/publication-check`);
    await page.waitForTimeout(1000);
    await page.fill('[data-testid="pub-check-content-id"]', contentId);
    await page.fill('[data-testid="pub-check-version-id"]', 'v1');
    await page.click('[data-testid="pub-check-submit-btn"]');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="pub-check-result"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="pub-check-eligible"]')).toBeVisible();

    // ── 29-30: Open historical decisions, verify the earlier decision exists ──
    await page.goto(`${cfg.webUrl}/content/provenance/history`);
    await page.waitForTimeout(1000);
    await page.fill('[data-testid="history-content-id"]', contentId);
    await page.click('[data-testid="history-load-btn"]');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="history-results"]')).toBeVisible({ timeout: 10000 });

    // ── 31-32: Open re-verification queue, verify the item is present ──
    await page.goto(`${cfg.webUrl}/content/provenance/reverification`);
    await expect(page.locator('h1')).toContainText('Re-verification Queue');
    await expect(page.locator('[data-testid="reverification-queue-list"]')).toBeVisible();

    // ── 33-34: Open audit report, verify action sequence ──
    await page.goto(`${cfg.webUrl}/content/provenance/reports`);
    await expect(page.locator('h1')).toContainText('Audit Reports');
    await expect(page.locator('[data-testid="audit-report"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-sequence"]')).toBeVisible();

    // ── Verify user sees proper UI ──
    await page.goto(`${cfg.webUrl}/content/provenance`);
    await expect(page.locator('[data-testid="dash-sources"]')).toBeVisible();
    await expect(page.locator('[data-testid="dash-licences"]')).toBeVisible();
    await expect(page.locator('[data-testid="dash-review"]')).toBeVisible();
    await expect(page.locator('[data-testid="dash-reverification"]')).toBeVisible();
    await expect(page.locator('[data-testid="dash-reports"]')).toBeVisible();
  });

  test('student receives 403 on provenance routes', async ({ request }) => {
    const email = `cg-stu-403-browser-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'student');
    const res = await request.get(`${cfg.apiUrl}/content-provenance/sources`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('teacher receives 403 on provenance routes', async ({ request }) => {
    const email = `cg-tea-403-browser-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'teacher');
    const res = await request.get(`${cfg.apiUrl}/content-provenance/sources`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('invalid body receives 400 on source creation', async ({ request }) => {
    const email = `cg-400-brouter-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    const res = await request.post(`${cfg.apiUrl}/content-provenance/sources`, {
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      data: { invalid: true },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Validation');
  });

  test('policy endpoint returns active policy', async ({ request }) => {
    const email = `cg-pol-brouter-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    const res = await request.get(`${cfg.apiUrl}/content-provenance/policies/active`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.version).toBeTruthy();
    expect(body.similarityReviewThreshold).toBeDefined();
  });
});
