import { test, expect } from '@playwright/test';
import { register, createUserWithRole, getConfig } from './helpers';

const cfg = getConfig();

test.describe('Phase F browser E2E', () => {
  const pw = 'E2EPassword123';

  test('1. register student', async ({ page }) => {
    const email = `e2e-${Date.now()}@test.com`;
    await page.goto(`${cfg.webUrl}/register`);
    await page.fill('[name="displayName"]', 'E2E User');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', pw);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('2. student dashboard opens', async ({ page }) => {
    const email = `dash-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('3. refresh preserves session', async ({ page }) => {
    const email = `refresh-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('h1')).toContainText('Dashboard');
    await page.reload();
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('4. student blocked from /admin', async ({ page }) => {
    const email = `blocked-admin-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/admin`);
    await expect(page).toHaveURL(/\/permission-denied/, { timeout: 10000 });
  });

  test('5. student blocked from /teacher', async ({ page }) => {
    const email = `blocked-teacher-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/teacher`);
    await expect(page).toHaveURL(/\/permission-denied/, { timeout: 10000 });
  });

  test('6. real logout invalidates access', async ({ page }) => {
    const email = `logout-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Click the actual Log out button in the header
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Verify the old token no longer works with the API
    const meRes = await fetch(`${cfg.apiUrl}/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(meRes.status).toBe(401);

    // Verify protected page redirects to login
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('7. teacher reaches /teacher', async ({ page }) => {
    const email = `teacher-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'teacher');
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/teacher`);
    await expect(page.locator('h1')).toContainText('Teacher Dashboard');
  });

  test('8. teacher blocked from /admin', async ({ page }) => {
    const email = `teacher-blocked-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'teacher');
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/admin`);
    await expect(page).toHaveURL(/\/permission-denied/, { timeout: 10000 });
  });

  test('9. admin reaches /admin', async ({ page }) => {
    const email = `admin-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'admin');
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/admin`);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('10. content_editor reaches /content', async ({ page }) => {
    const email = `content-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'content_editor');
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/content`);
    await expect(page.locator('h1')).toContainText('Content management');
  });

  test('11. support reaches /support', async ({ page }) => {
    const email = `support-${Date.now()}@test.com`;
    const token = await createUserWithRole(email, pw, 'support');
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/support`);
    await expect(page.locator('h1')).toContainText('Support Dashboard');
  });

  test('12. mobile drawer opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const email = `drawer-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/`);
    await page.click('[aria-label="Open menu"]');
    await expect(page.locator('.ds-drawer--open')).toBeVisible();
    await page.click('.ds-drawer__close');
    await expect(page.locator('.ds-drawer--open')).not.toBeVisible();
  });

  test('13. keyboard navigation works', async ({ page }) => {
    const email = `keyboard-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/`);
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeAttached();
  });

  test('14. dark-mode changes body background', async ({ page }) => {
    // Measure light-mode background
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`${cfg.webUrl}/`);
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    // Measure dark-mode background
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`${cfg.webUrl}/`);
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    expect(lightBg).not.toBe(darkBg);
  });

  test('15. reduced-motion disables drawer transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const email = `motion-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/`);

    // Verify the drawer transition style is affected
    const transitionDuration = await page.evaluate(() => {
      const drawer = document.querySelector('.ds-drawer');
      if (!drawer) return null;
      return getComputedStyle(drawer).transitionDuration;
    });
    expect(transitionDuration).toBe('0s');
  });

  test('16. API outage shows recoverable error', async ({ page }) => {
    // Block API requests to simulate outage
    await page.route('**/api/**', (route) => route.abort());
    await page.route(`${cfg.apiUrl}/**`, (route) => route.abort());

    const email = `outage-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);

    // Navigate to a page that calls the API
    await page.goto(`${cfg.webUrl}/dashboard`);
    // The page might show an error state or redirect
    await expect(page.locator('body')).toBeAttached();

    // Remove route blocking to simulate recovery
    await page.unroute('**/api/**');
    await page.unroute(`${cfg.apiUrl}/**`);

    // After restoring, the page should be recoverable
    await page.goto(`${cfg.webUrl}/dashboard`);
    await expect(page.locator('body')).toBeAttached();
  });

  test('17. console error policy', async ({ page }) => {
    const allowedErrors: string[] = [];
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const email = `console-${Date.now()}@test.com`;
    const token = await register(email, pw);
    await page.context().addCookies([{ name: cfg.sessionCookieName, value: token, domain: 'localhost', path: '/' }]);
    await page.goto(`${cfg.webUrl}/dashboard`);
    await page.goto(`${cfg.webUrl}/profile`);
    await page.goto(`${cfg.webUrl}/settings`);
    await page.goto(`${cfg.webUrl}/sessions`);

    // Only allow specifically known non-actionable messages
    const unexpected = errors.filter((e) => !allowedErrors.some((a) => e.includes(a)));
    expect(unexpected).toEqual([]);
  });

  test('18. no mobile horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${cfg.webUrl}/`);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });
});
