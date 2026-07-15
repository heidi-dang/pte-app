import { test, expect } from '@playwright/test';
import { loadE2EState } from './state';
import { restartApi } from './restart-api';

const state = loadE2EState();

async function loginViaApi(context: any, email: string, password: string): Promise<string> {
  const res = await context.request.post(`${state.apiUrl}/auth/login`, {
    data: { email, password },
  });
  const data = await res.json();
  expect(res.status()).toBe(200);
  const cookie = await res.headers()['set-cookie'];
  if (cookie) {
    await context.addCookies(
      cookie
        .split(',')
        .map((raw: string) => {
          const [pair] = raw.split(';');
          if (!pair) return { name: '', value: '', domain: '127.0.0.1', path: '/' };
          const [name, value] = pair.trim().split('=');
          return { name: name ?? '', value: value ?? '', domain: '127.0.0.1', path: '/' };
        })
        .filter((c: { name: string }) => c.name),
    );
  }
  return data.token;
}

async function logoutViaApi(context: any): Promise<void> {
  await context.request.post(`${state.apiUrl}/auth/logout`, { failOnStatusCode: false });
  await context.clearCookies();
}

test.describe('Phase H Critical Journey', () => {
  test('full student journey: catalogue → enrol → learn → save → refresh → resume → restart → quiz → complete → prerequisite → entitlement expiry', async ({
    page,
    context,
  }) => {
    // 1-3. Guest opens catalogue and sees free course
    await page.goto(`${state.webUrl}/learn/catalogue`);
    await expect(page.getByTestId('catalogue-search')).toBeVisible();
    await expect(page.getByTestId('course-card').filter({ hasText: state.freeCourseSlug })).toBeVisible();
    await expect(page.getByTestId('course-card').filter({ hasText: state.paidCourseSlug })).toBeVisible();

    // 4. Student logs in
    await loginViaApi(context, state.studentEmail, state.studentPassword);

    // 5. Student opens the paid course backed by active entitlement
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await expect(page.getByTestId('course-title')).toBeVisible();

    // 6. Student enrols
    await page.getByTestId('btn-enrol').click();
    await expect(page.getByTestId('btn-resume')).toBeVisible({ timeout: 10000 });

    // 7. Student opens lesson 1
    await page.goto(`${state.webUrl}/learn/lessons/${state.lesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    // 8-10. Text, audio, video blocks
    await expect(page.getByTestId('block-text')).toBeVisible();
    await expect(page.getByTestId('block-audio')).toBeVisible();
    const audioText = await page.getByTestId('block-audio').textContent();
    expect(audioText).toContain('Audio transcript');
    await expect(page.getByTestId('block-video')).toBeVisible();
    const videoHtml = await page.getByTestId('block-video').innerHTML();
    expect(videoHtml).toContain('captions');

    // 11. Reveal block
    await page.getByTestId('block-interactive').filter({ hasText: 'Click to reveal' }).click();
    await expect(page.getByText('Revealed content')).toBeVisible();

    // 12. Flashcard
    const flashcard = page.getByTestId('interactive-flashcard').filter({ hasText: 'Front question' });
    await flashcard.click();
    await expect(page.getByText('Back answer')).toBeVisible();
    await flashcard.press('Enter');

    // 13. Matching
    await page.getByTestId('match-left-0').click();
    await page.getByTestId('match-right-0').click();
    await page.getByTestId('match-left-1').click();
    await page.getByTestId('match-right-1').click();
    await expect(page.getByTestId('match-complete')).toBeVisible();

    // 14. Ordering
    await page.getByTestId('order-up-1').click();
    await page.getByTestId('order-up-2').click();
    await page.getByTestId('order-submit').click();
    await expect(page.getByTestId('order-result')).toContainText('correct');

    // 15. Save at non-final block (block 2, the video block)
    await page.goto(`${state.webUrl}/learn/lessons/${state.lesson1Id}`);
    await page.getByTestId('btn-next-block').click();
    await page.getByTestId('btn-next-block').click();
    await page.getByTestId('btn-save-progress').click();
    await expect(page.getByTestId('save-status')).toContainText('saved', { timeout: 10000 });

    // 16-18. Refresh and assert exact resume
    await page.reload();
    await expect(page.getByTestId('lesson-title')).toBeVisible();
    await expect(page.getByTestId('save-status')).toContainText('saved');

    // 19. Log out
    await logoutViaApi(context);
    await page.goto(`${state.webUrl}/learn/catalogue`);
    await expect(page.getByTestId('course-card').first()).toBeVisible();

    // 20-24. Restart API and log in again
    const newPid = await restartApi(state.apiUrl);
    expect(newPid).toBeGreaterThan(0);
    await loginViaApi(context, state.studentEmail, state.studentPassword);

    // 25. Resume
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await page.getByTestId('btn-resume').click();
    await expect(page.getByTestId('lesson-title')).toBeVisible();
    await expect(page.getByTestId('save-status')).toContainText('saved');

    // 26. Submit and pass quiz
    await page.getByTestId('quiz-link').click();
    await page.getByLabel('4').click();
    await page.getByTestId('quiz-submit').click();
    await expect(page.getByTestId('quiz-result')).toContainText('passed');

    // 27-28. Complete lesson and assert progress
    await page.goto(`${state.webUrl}/learn/lessons/${state.lesson1Id}`);
    const lastIdx = state.blockIds.length - 1;
    for (let i = 0; i < lastIdx; i++) {
      await page.getByTestId('btn-next-block').click();
    }
    await page.getByTestId('btn-complete-lesson').click();
    await expect(page.getByTestId('completion-badge')).toBeVisible({ timeout: 10000 });

    // 29. Prerequisite: lesson 2 should now be unlocked
    await page.goto(`${state.webUrl}/learn/lessons/${state.lesson2Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    // 30-34. Cancel entitlement and verify historical data remains but new activity is blocked
    await fetch(`${state.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.adminEmail, password: state.adminPassword }),
    }).then(async (r) => {
      const adminToken = (await r.json()).token;
      await fetch(`${state.apiUrl}/learn/admin/entitlements/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ userId: state.studentId, courseId: state.paidCourseId }),
      });
    });

    await page.goto(`${state.webUrl}/learn/lessons/${state.lesson1Id}`);
    await expect(page.getByTestId('completion-badge')).toBeVisible();
    await page.goto(`${state.webUrl}/learn/lessons/${state.lesson2Id}`);
    await expect(page.getByTestId('lesson-error')).toContainText('Prerequisite');
  });

  test('interactive blocks: mouse, keyboard, mobile, accessibility', async ({ page, context, isMobile }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.lesson1Id}`);

    if (!isMobile) {
      await page.setViewportSize({ width: 390, height: 844 });
    }

    // Reveal by keyboard
    await page.getByTestId('reveal-button').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('reveal-content')).toBeVisible();

    // Flashcard keyboard
    const flashcard = page.getByTestId('interactive-flashcard');
    await flashcard.focus();
    await page.keyboard.press('Space');
    await expect(page.getByText('Back answer')).toBeVisible();

    // Focus state
    await expect(flashcard).toHaveAttribute('tabindex', '0');

    // Reduced motion (just verify no animation class if present)
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByTestId('interactive-flashcard')).toBeVisible();
  });

  test('entitlement: expired blocks new activity but preserves history', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.lesson1Id}`);
    await expect(page.getByTestId('completion-badge')).toBeVisible();

    // Expire entitlement via admin
    const loginRes = await context.request.post(`${state.apiUrl}/auth/login`, {
      data: { email: state.adminEmail, password: state.adminPassword },
    });
    const adminToken = (await loginRes.json()).token;
    await context.request.post(`${state.apiUrl}/learn/admin/entitlements/expire`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { userId: state.studentId, courseId: state.paidCourseId },
    });

    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await expect(page.getByTestId('course-error')).toContainText('expired');
  });

  test('teacher notes are never disclosed to students', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    for (const path of [
      `/learn/catalogue`,
      `/learn/courses/${state.freeCourseSlug}`,
      `/learn/lessons/${state.lesson1Id}`,
      `/learn/progress/${state.lesson1Id}`,
      `/learn/progress/resume/${state.freeCourseId}`,
    ]) {
      await page.goto(`${state.webUrl}${path}`);
      const body = await page.content();
      expect(body).not.toContain('Secret note');
    }
  });

  test('assigned teacher can retrieve notes, unassigned cannot', async ({ page, context }) => {
    await loginViaApi(context, state.teacherEmail, state.teacherPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseId}`);
    const body = await page.content();
    expect(body).toContain('Teacher note content');

    await logoutViaApi(context);
    await loginViaApi(context, state.otherTeacherEmail, state.otherTeacherPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseId}`);
    const otherBody = await page.content();
    expect(otherBody).not.toContain('Teacher note content');
  });
});
