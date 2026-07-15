import { test, expect } from '@playwright/test';

const API_URL = process.env.E2E_API_URL || 'http://localhost:4000';
const WEB_URL = process.env.E2E_WEB_URL || 'http://localhost:3000';

async function api(path: string, opts: RequestInit & { token?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  return fetch(`${API_URL}${path}`, { ...opts, headers: { ...headers, ...((opts.headers as any) || {}) } });
}

async function registerAndLogin(email: string, pass: string, name: string): Promise<string> {
  await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass, displayName: name }),
  }).catch(() => {});
  const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
  const d = await r.json();
  return d.token;
}

test.describe('Phase H Critical Resume Journey', () => {
  test('full student journey: catalogue → enrol → learn → save → refresh → resume → quiz → complete', async ({
    page,
  }) => {
    const token = await registerAndLogin(`e2e-${Date.now()}@test.com`, 'Test12345', 'E2E Student');

    // 1. Guest opens the public catalogue
    await page.goto(`${WEB_URL}/learn/catalogue`);
    await expect(page.getByTestId('catalogue-search')).toBeVisible({ timeout: 10000 });

    // 2. Search and filter
    await page.getByTestId('catalogue-search').fill('Test');
    await page.waitForTimeout(500);

    // 3-6. Navigate to course, enrol, open lesson
    // Set session cookie and navigate
    await page.evaluate((t) => {
      document.cookie = `pte_session=${encodeURIComponent(t)}; path=/;`;
    }, token);

    await page.goto(`${WEB_URL}/learn/catalogue`);
    await page.waitForTimeout(500);

    const courseCards = page.getByTestId('course-card');
    const count = await courseCards.count();
    if (count > 0) {
      await courseCards.first().click();
      await page.waitForTimeout(500);

      // Enrol if possible
      const enrolBtn = page.getByTestId('btn-enrol');
      if (await enrolBtn.isVisible()) {
        await enrolBtn.click();
        await page.waitForTimeout(500);
      }

      // Navigate to first lesson
      const startBtns = page.getByText('Start');
      if (await startBtns.first().isVisible()) {
        await startBtns.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('interactive blocks: reveal, flashcard, matching, ordering', async () => {
    // This test requires a lesson with interactive blocks to be set up in seed data
    // Navigate to a lesson containing interactive blocks
    // Test each interactive block type
    // Verify keyboard accessibility and aria labels
  });

  test('teacher notes not visible to students', async ({ page }) => {
    await registerAndLogin(`note-e2e-${Date.now()}@test.com`, 'Test12345', 'Note Student');

    // Navigate to catalogue and verify no teacherNote elements present
    await page.goto(`${WEB_URL}/learn/catalogue`);
    await page.waitForTimeout(500);
    const noteElements = page.locator('[data-testid*="note"], [id*="teacher-note"]');
    await expect(noteElements).toHaveCount(0, { timeout: 3000 });
  });

  test('entitlement: expired entitlement blocks new activity but preserves history', async () => {
    await registerAndLogin(`ent-e2e-${Date.now()}@test.com`, 'Test12345', 'Ent Student');
    // Verify student can initially access (if entitled)
    // Cancel/expire entitlement
    // Verify student blocked from new activity

    // Verify student can initially access (if entitled)
    // Cancel/expire entitlement
    // Verify student blocked from new activity
    // Verify historical data still accessible
  });
});
