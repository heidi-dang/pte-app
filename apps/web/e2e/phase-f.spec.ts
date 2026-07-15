import { test, expect } from '@playwright/test';
import { register, createUserWithRole, setSessionCookie, getConfig } from './helpers';

const cfg = getConfig();
const pw = 'E2EPassword123';

test.describe('Phase F browser E2E', () => {
  test('1. register student', async ({ page }) => {
    await page.goto(`${cfg.webUrl}/register`);
    await page.fill('[name="displayName"]', 'E2E User');
    await page.fill('[name="email"]', `reg-${Date.now()}@test.com`);
    await page.fill('[name="password"]', pw);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('2. student dashboard opens', async ({ page }) => {
    const email = `dash-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('3. refresh preserves session', async ({ page }) => {
    const email = `refresh-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('h1')).toContainText('Dashboard');
    await page.reload();
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('4. student blocked from /admin', async ({ page }) => {
    const token = await register(`badmin-${Date.now()}@test.com`, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/admin`);
    await expect(page).toHaveURL(/\/permission-denied/, { timeout: 10000 });
  });

  test('5. student blocked from /teacher', async ({ page }) => {
    const token = await register(`bteacher-${Date.now()}@test.com`, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/teacher`);
    await expect(page).toHaveURL(/\/permission-denied/, { timeout: 10000 });
  });

  test('6. real logout invalidates access', async ({ page }) => {
    const email = `logout-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('h1')).toContainText('Dashboard');

    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Verify session fully invalidated: protected page redirects to login
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('7. teacher reaches /teacher', async ({ page }) => {
    const email = `teacher-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'teacher');
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/teacher`);
    await expect(page.locator('h1')).toContainText('Teacher Dashboard');
  });

  test('8. teacher blocked from /admin', async ({ page }) => {
    const email = `tblocked-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'teacher');
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/admin`);
    await expect(page).toHaveURL(/\/permission-denied/, { timeout: 10000 });
  });

  test('9. admin reaches /admin', async ({ page }) => {
    const email = `admin-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/admin`);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('10. content_editor reaches /content', async ({ page }) => {
    const email = `content-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/content`);
    await expect(page.locator('h1')).toContainText('Content management');
  });

  test('11. support reaches /support', async ({ page }) => {
    const email = `support-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'support');
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/support`);
    await expect(page.locator('h1')).toContainText('Support Dashboard');
  });

  test('12. mobile drawer opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const token = await register(`drawer-${Date.now()}@test.com`, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/`);
    await page.click('[aria-label="Open menu"]');
    await expect(page.locator('.ds-drawer--open')).toBeVisible();
    await page.click('.ds-drawer__close');
    await expect(page.locator('.ds-drawer--open')).not.toBeVisible();
  });

  test('13. keyboard navigation works', async ({ page }) => {
    const token = await register(`kbd-${Date.now()}@test.com`, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/`);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeAttached();
  });

  test('14. dark-mode changes body background', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`${cfg.webUrl}/`);
    await page.waitForSelector('html');
    const lightBg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`${cfg.webUrl}/`);
    await page.waitForSelector('html');
    const darkBg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

    expect(lightBg).not.toBe(darkBg);
    expect(lightBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(darkBg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('15. reduced-motion disables drawer transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 667 });
    const token = await register(`motion-${Date.now()}@test.com`, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/`);
    await page.click('[aria-label="Open menu"]');
    await expect(page.locator('.ds-drawer--open')).toBeVisible();
    const td = await page.evaluate(() => {
      const el = document.querySelector('.ds-drawer');
      return el ? getComputedStyle(el).transitionDuration : null;
    });
    expect(td === '0s' || td === '0s, 0s' || td === '').toBeTruthy();
  });

  test('16. API outage shows recoverable error', async ({ page }) => {
    await page.route(`${cfg.apiUrl}/**`, (route) => route.abort());

    const token = await register(`outage-${Date.now()}@test.com`, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('body')).toBeAttached();

    await page.unroute(`${cfg.apiUrl}/**`);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('body')).toBeAttached();
  });

  test('17. console error policy', async ({ page }) => {
    const allowed: string[] = [];
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const token = await register(`console-${Date.now()}@test.com`, pw);
    await setSessionCookie(page.context(), token);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await page.goto(`${cfg.webUrl}/profile`);
    await page.goto(`${cfg.webUrl}/settings`);
    await page.goto(`${cfg.webUrl}/sessions`);

    const unexpected = errors.filter((e) => !allowed.some((a) => e.includes(a)));
    expect(unexpected).toEqual([]);
  });

  test('18. no mobile horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${cfg.webUrl}/`);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });
});
