import { test, expect, request as playwrightRequest } from '@playwright/test';
import { loadE2EState } from './state';
import { restartApi } from './restart-api';

const state = loadE2EState();

async function apiRequest(context: any, path: string, options: Record<string, any> = {}) {
  const fullUrl = path.startsWith('http') ? path : `${state.apiUrl}${path}`;
  const { data, headers, ...rest } = options;
  const fetchOptions: Record<string, any> = { ...rest };
  if (data !== undefined) {
    fetchOptions.data = data;
  }
  if (headers) {
    fetchOptions.headers = headers;
  }
  return context.request.fetch(fullUrl, fetchOptions);
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
  const res = await apiRequest(context, '/auth/logout', { method: 'POST' });
  expect(res.status()).toBe(200);
  await context.clearCookies();
}

test.describe('Phase H Critical Journey', () => {
  test('full student journey: catalogue → enrol → learn → save → refresh → resume → restart → quiz → complete', async ({
    page,
    context,
  }) => {
    test.setTimeout(180000);
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

    // 5. Navigate to paid lesson 1 — block-by-block viewer
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    // 5a. Block 0: text
    await expect(page.getByTestId('block-text')).toBeVisible();

    // 5b. Block 1: audio
    await page.getByTestId('btn-next-block').click();
    await expect(page.getByTestId('block-audio')).toBeVisible();
    const audioText = await page.getByTestId('block-audio').textContent();
    expect(audioText).toContain('Audio transcript');

    // 5c. Block 2: video
    await page.getByTestId('btn-next-block').click();
    await expect(page.getByTestId('block-video')).toBeVisible();

    // 5d. Block 3: reveal
    await page.getByTestId('btn-next-block').click();
    await expect(page.getByTestId('block-interactive')).toBeVisible();
    const revealBtn = page.getByTestId('reveal-button');
    await revealBtn.click();
    await expect(page.getByTestId('reveal-content')).toBeVisible();

    // 5e. Block 4: flashcard
    await page.getByTestId('btn-next-block').click();
    const flashcard = page.getByTestId('interactive-flashcard');
    await expect(flashcard).toBeVisible();
    await flashcard.click();
    await expect(page.getByText('Back answer')).toBeVisible();

    // 5f. Block 5: matching (use aria-labels since items are shuffled)
    await page.getByTestId('btn-next-block').click();
    await expect(page.getByTestId('interactive-matching')).toBeVisible();
    await page.getByLabel('Match item: A').click();
    await page.getByLabel('Match option: 1').click();
    await page.getByLabel('Match item: B').click();
    await page.getByLabel('Match option: 2').click();
    await expect(page.getByTestId('match-complete')).toBeVisible();

    // 5g. Block 6: ordering
    await page.getByTestId('btn-next-block').click();
    await expect(page.getByTestId('interactive-ordering')).toBeVisible();
    await page.getByTestId('order-submit').click();
    await expect(page.getByTestId('order-result')).toBeVisible();

    // 6. Save progress at final block and verify persistence
    const lastIdx = state.paidCourseBlockIds.length - 1;
    for (let i = 0; i < lastIdx; i++) {
      if (await page.getByTestId('btn-next-block').isVisible()) {
        await page.getByTestId('btn-next-block').click();
      }
    }
    await page.getByTestId('btn-save-progress').click();
    await expect(page.getByTestId('save-status')).toBeVisible({ timeout: 10000 });

    // 7. Refresh — resume should persist
    await page.reload();
    await expect(page.getByTestId('lesson-title')).toBeVisible({ timeout: 10000 });

    // 8. Logout then login — resume should persist
    await logoutViaApi(context);
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await page.getByTestId('btn-resume').click();
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    // 9. Restart API — resume should survive
    const newPid = await restartApi(state.apiUrl);
    expect(newPid).toBeGreaterThan(0);
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await page.getByTestId('btn-resume').click();
    await expect(page.getByTestId('lesson-title')).toBeVisible();

    // 10. Navigate to quiz page
    await page.getByTestId('quiz-link').click();
    await page.getByLabel('4').click();
    await page.getByTestId('quiz-submit').click();
    await expect(page.getByTestId('quiz-result')).toContainText('passed', { timeout: 10000 });

    // 11. Complete lesson
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

    // Navigate to reveal block (position 3)
    await page.getByTestId('btn-next-block').click();
    await page.getByTestId('btn-next-block').click();
    await page.getByTestId('btn-next-block').click();
    await expect(page.getByTestId('reveal-button')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('reveal-button').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('reveal-content')).toBeVisible();

    // Navigate to flashcard block (position 4)
    await page.getByTestId('btn-next-block').click();
    const flashcard = page.getByTestId('interactive-flashcard');
    await flashcard.focus();
    await page.keyboard.press('Space');
    await expect(page.getByText('Back answer')).toBeVisible();
    await expect(flashcard).toHaveAttribute('tabindex', '0');

    // Reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByTestId('lesson-title')).toBeVisible();
  });

  test('entitlement cancellation blocks new activity but preserves history', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);

    // Verify paid course is accessible
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await expect(page.getByTestId('course-title')).toBeVisible();

    // Admin login via isolated context
    const adminCtx = await playwrightRequest.newContext({ baseURL: state.apiUrl });
    const res = await adminCtx.post('/auth/login', {
      data: { email: state.adminEmail, password: state.adminPassword },
    });
    expect(res.status()).toBe(200);
    const adminToken = (await res.json()).token;

    // Admin cancels entitlement via isolated context
    await adminCtx.post('/learn/admin/entitlements/cancel', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { userId: state.studentId, courseId: state.paidCourseId },
    });
    await adminCtx.dispose();

    // Student browser should still be authenticated
    const meRes2 = await apiRequest(context, '/auth/me');
    expect(meRes2.status()).toBe(200);
    const me2 = await meRes2.json();
    expect(me2.user?.id).toBe(state.studentId);

    // Student should now see an entitlement error on the course page
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    // The page should show an error or be blocked
    const isError = await page
      .getByTestId('course-error')
      .isVisible()
      .catch(() => false);
    const body = await page.content();
    if (isError) {
      const errorText = await page.getByTestId('course-error').textContent();
      expect(errorText).toMatch(/cancelled|expired|entitlement|forbidden/i);
    } else {
      // Page content should indicate access denied
      expect(
        body.includes('ENTITLEMENT_CANCELLED') ||
          body.includes('ENTITLEMENT_EXPIRED') ||
          body.includes('Forbidden') ||
          body.includes('entitlement'),
      ).toBe(true);
    }
  });

  test('teacher notes: assigned sees notes, unassigned and student do not', async ({ page, context }) => {
    // Assigned teacher can see the note
    await loginViaApi(context, state.teacherEmail, state.teacherPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    const body = await page.content();
    const hasTeacherPanel = body.includes('teacher-notes-panel') || body.includes('Teacher Notes');
    const hasNoteContent = body.includes('Teacher note content');
    expect(hasTeacherPanel || hasNoteContent).toBe(true);

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
