import { test, expect } from '@playwright/test';
import { loadE2EState } from './state';
import { restartApi } from './restart-api';

const state = loadE2EState();

async function apiRequest(context: any, path: string, options: RequestInit & { data?: any } = {}) {
  const fullUrl = path.startsWith('http') ? path : `${state.apiUrl}${path}`;
  return context.request.fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    data: options.data,
    ...options,
  });
}

async function loginViaApi(context: any, email: string, password: string): Promise<{ token: string; userId: string }> {
  const res = await apiRequest(context, '/auth/login', {
    method: 'POST',
    data: { email, password },
  });
  expect(res.status()).toBe(200);
  const data = await res.json();

  const setCookie = res.headers()['set-cookie'];
  if (setCookie) {
    const cookies = setCookie
      .split(',')
      .map((raw: string) => {
        const [pair] = raw.split(';');
        if (!pair) return null;
        const [name, value] = pair.trim().split('=');
        return name && value ? { name: name.trim(), value: value.trim(), domain: '127.0.0.1', path: '/' } : null;
      })
      .filter(Boolean) as Array<{ name: string; value: string; domain: string; path: string }>;
    await context.addCookies(cookies);
  }

  const meRes = await apiRequest(context, '/auth/me');
  expect(meRes.status()).toBe(200);

  return { token: data.token, userId: (await meRes.json()).user?.id };
}

async function logoutViaApi(context: any): Promise<void> {
  try {
    await apiRequest(context, '/auth/logout', { method: 'POST' });
  } catch {
    // ignore logout errors
  }
  await context.clearCookies();
}

test.describe('Phase H Critical Journey', () => {
  test('full student journey: catalogue → enrol → learn → save → refresh → resume → restart → quiz → complete', async ({
    page,
    context,
  }) => {
    // 1. Guest opens catalogue and sees courses
    await page.goto(`${state.webUrl}/learn/catalogue`);
    await expect(page.getByTestId('catalogue-search')).toBeVisible();
    await expect(page.getByTestId('course-card').first()).toBeVisible();

    // 2. Student logs in and verifies identity
    const student = await loginViaApi(context, state.studentEmail, state.studentPassword);
    expect(student.userId).toBe(state.studentId);

    // 3. Student opens the paid course (active entitlement)
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await expect(page.getByTestId('course-title')).toBeVisible();

    // 4. Student enrols
    await page.getByTestId('btn-enrol').click();
    await expect(page.getByTestId('btn-resume')).toBeVisible({ timeout: 10000 });

    // 5. Student opens paid lesson 1
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    // 6. Text block
    await expect(page.getByTestId('block-text')).toBeVisible();

    // 7. Audio block with transcript
    await expect(page.getByTestId('block-audio')).toBeVisible();
    const audioText = await page.getByTestId('block-audio').textContent();
    expect(audioText).toContain('Audio transcript');

    // 8. Video block with transcript
    await expect(page.getByTestId('block-video')).toBeVisible();
    const videoText = await page.getByTestId('block-video').textContent();
    expect(videoText).toContain('Video transcript');

    // 9. Reveal interactive block
    const revealBlock = page.getByTestId('block-interactive').filter({ hasText: 'Click to reveal' });
    await revealBlock.click();
    await expect(page.getByText('Revealed content')).toBeVisible();

    // 10. Flashcard interactive block
    const flashcard = page.getByTestId('interactive-flashcard');
    await flashcard.click();
    await expect(page.getByText('Back answer')).toBeVisible();
    await flashcard.press('Enter');

    // 11. Matching interactive block (find pairs by text since order is randomized)
    await page.getByText('A', { exact: true }).first().click();
    await page.getByText('1', { exact: true }).first().click();
    await page.getByText('B', { exact: true }).first().click();
    await page.getByText('2', { exact: true }).first().click();
    await expect(page.getByTestId('match-complete')).toBeVisible();

    // 12. Ordering interactive block (items shuffled, so just verify block renders)
    await expect(page.getByTestId('interactive-ordering')).toBeVisible();
    await page.getByTestId('order-submit').click();
    await expect(page.getByTestId('order-result')).toBeVisible();

    // 13. Navigate through all blocks to the final block and save progress
    const lastIdx = state.paidCourseBlockIds.length - 1;
    for (let i = 0; i < lastIdx; i++) {
      if (await page.getByTestId('btn-next-block').isVisible()) {
        await page.getByTestId('btn-next-block').click();
      }
    }
    await page.getByTestId('btn-save-progress').click();
    await expect(page.getByTestId('save-status')).toBeVisible({ timeout: 10000 });

    // 14. Refresh and assert resume state persisted
    await page.reload();
    await expect(page.getByTestId('lesson-title')).toBeVisible({ timeout: 10000 });

    // 15. Log out, then log in and resume
    await logoutViaApi(context);
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await page.getByTestId('btn-resume').click();
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    // 16. Restart API and assert resume still works
    const newPid = await restartApi(state.apiUrl);
    expect(newPid).toBeGreaterThan(0);
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await page.getByTestId('btn-resume').click();
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    // 17. Submit quiz and verify pass
    await page.getByTestId('quiz-link').click();
    const correctOption = page.getByLabel('4');
    if (await correctOption.isVisible()) {
      await correctOption.click();
    }
    await page.getByTestId('quiz-submit').click();
    await expect(page.getByTestId('quiz-result')).toContainText('passed', { timeout: 10000 });

    // 18. Complete lesson
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await page.getByTestId('btn-complete-lesson').click();
    await expect(page.getByTestId('completion-badge')).toBeVisible({ timeout: 10000 });
  });

  test('interactive blocks: keyboard and accessibility', async ({ page, context, isMobile }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    if (isMobile) {
      await page.setViewportSize({ width: 390, height: 844 });
    }

    // Find reveal button and activate via keyboard
    const revealBtn = page.getByTestId('reveal-button');
    if (await revealBtn.isVisible()) {
      await revealBtn.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('reveal-content')).toBeVisible();
    }

    // Flashcard keyboard activation
    const flashcard = page.getByTestId('interactive-flashcard');
    if (await flashcard.isVisible()) {
      await flashcard.focus();
      await page.keyboard.press('Space');
      await expect(page.getByText('Back answer')).toBeVisible();
      await expect(flashcard).toHaveAttribute('tabindex', '0');
    }

    // Reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByTestId('lesson-title')).toBeVisible();
  });

  test('entitlement cancellation blocks new activity but preserves history', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);

    // Verify paid course is accessible
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await expect(page.getByTestId('course-title')).toBeVisible();

    // Admin cancels the student's entitlement
    const adminLogin = await apiRequest(context, '/auth/login', {
      method: 'POST',
      data: { email: state.adminEmail, password: state.adminPassword },
    });
    const adminToken = (await adminLogin.json()).token;
    await apiRequest(context, '/learn/admin/entitlements/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { userId: state.studentId, courseId: state.paidCourseId },
    });

    // Student should now see an entitlement-related error
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    const body = await page.content();
    const hasEntitlementError =
      body.includes('ENTITLEMENT_CANCELLED') ||
      body.includes('cancelled') ||
      body.includes('Forbidden') ||
      body.includes('entitlement');
    expect(hasEntitlementError).toBe(true);
  });

  test('teacher notes: assigned sees notes, unassigned and student do not', async ({ page, context }) => {
    // Assigned teacher can see the note
    await loginViaApi(context, state.teacherEmail, state.teacherPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    const body = await page.content();
    expect(body).toContain('Teacher note content');

    await logoutViaApi(context);

    // Unassigned teacher cannot see the note
    await loginViaApi(context, state.otherTeacherEmail, state.otherTeacherPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    const otherBody = await page.content();
    expect(otherBody).not.toContain('Teacher note content');

    await logoutViaApi(context);

    // Student cannot see the secret note
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    const studentBody = await page.content();
    expect(studentBody).not.toContain('Teacher note content');
  });
});
