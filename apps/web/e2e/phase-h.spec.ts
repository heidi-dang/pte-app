import { test, expect } from '@playwright/test';
import { loadE2EState } from './state';
import { restartApi } from './restart-api';

const state = loadE2EState();

async function apiRequest(context: any, path: string, options: Record<string, any> = {}) {
  const fullUrl = path.startsWith('http') ? path : `${state.apiUrl}${path}`;
  const { data, headers, ...rest } = options;
  const fetchOptions: Record<string, any> = { ...rest };
  fetchOptions.headers = { ...headers };
  if (data !== undefined) {
    fetchOptions.data = data;
    fetchOptions.headers['content-type'] = 'application/json';
  }
  return context.request.fetch(fullUrl, fetchOptions);
}

async function loginViaApi(context: any, email: string, password: string): Promise<{ token: string; userId: string }> {
  const res = await apiRequest(context, '/auth/login', { method: 'POST', data: { email, password } });
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
  await apiRequest(context, '/auth/logout', { method: 'POST' });
  await context.clearCookies();
}

async function verifyLessonData(context: any, lessonId: string): Promise<void> {
  const res = await apiRequest(context, `/learn/lessons/${lessonId}`);
  const data = await res.json();
  if (res.status() !== 200) {
    throw new Error(`Lesson API returned ${res.status()} for ${lessonId}: ${JSON.stringify(data)}`);
  }
  const blocks = data.blocks as Array<unknown> | undefined;
  if (!blocks || blocks.length === 0) {
    throw new Error(`Lesson ${lessonId} has ${blocks?.length ?? 0} blocks — cannot proceed`);
  }
}

async function resetLessonProgress(context: any, lessonId: string): Promise<void> {
  const res = await apiRequest(context, '/learn/progress', {
    method: 'POST',
    data: { lessonId, blockPosition: 0, blockId: '', mutationId: `reset-${Date.now()}` },
  });
  if (res.status() !== 200) {
    throw new Error(`Failed to reset progress for lesson ${lessonId}: ${res.status()}`);
  }
}

async function waitForBlock(page: any, testId: string, timeout = 10000) {
  await expect(page.getByTestId('btn-next-block')).toBeEnabled({ timeout });
  await page.getByTestId('btn-next-block').click();
  await expect(page.getByTestId(testId)).toBeVisible({ timeout });
}

// ================================================================
// Catalogue → Enrol → Lesson → Blocks
// ================================================================
test.describe('Phase H Critical Journey', () => {
  test('catalogue enrol and first block', async ({ page, context }) => {
    await page.goto(`${state.webUrl}/learn/catalogue`);
    await expect(page.getByTestId('catalogue-search')).toBeVisible();
    await expect(page.getByTestId('course-card').first()).toBeVisible();

    const student = await loginViaApi(context, state.studentEmail, state.studentPassword);
    expect(student.userId).toBe(state.studentId);

    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await expect(page.getByTestId('course-title')).toBeVisible();
    await page.getByTestId('btn-enrol').click();
    await expect(page.getByTestId('btn-resume')).toBeVisible({ timeout: 10000 });

    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();
    await expect(page.getByTestId('block-text')).toBeVisible();
  });

  test('navigate through all interactive blocks', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await verifyLessonData(context, state.paidCourseLesson1Id);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();
    await expect(page.getByTestId('btn-next-block')).toBeEnabled({ timeout: 10000 });

    // Block 1: audio
    await waitForBlock(page, 'block-audio');
    const audioText = await page.getByTestId('block-audio').textContent();
    expect(audioText).toContain('Audio transcript');

    // Block 2: video
    await waitForBlock(page, 'block-video');

    // Block 3: reveal
    await waitForBlock(page, 'block-interactive');
    await page.getByTestId('reveal-button').click();
    await expect(page.getByTestId('reveal-content')).toBeVisible();

    // Block 4: flashcard
    await waitForBlock(page, 'interactive-flashcard');
    await page.getByTestId('interactive-flashcard').click();
    await expect(page.getByText('Back answer')).toBeVisible();

    // Block 5: matching
    await waitForBlock(page, 'interactive-matching');
    await page.getByLabel('Match item: A').click();
    await page.getByLabel('Match option: 1').click();
    await page.getByLabel('Match item: B').click();
    await page.getByLabel('Match option: 2').click();
    await expect(page.getByTestId('match-complete')).toBeVisible();

    // Block 6: ordering
    await waitForBlock(page, 'interactive-ordering');
    await page.getByTestId('order-submit').click();
    await expect(page.getByTestId('order-result')).toBeVisible();
  });

  test('save progress and resume after refresh', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await verifyLessonData(context, state.paidCourseLesson1Id);
    await resetLessonProgress(context, state.paidCourseLesson1Id);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();
    await expect(page.getByTestId('btn-next-block')).toBeEnabled({ timeout: 10000 });

    // Advance to final block and save
    const lastIdx = state.paidCourseBlockIds.length - 1;
    for (let i = 0; i < lastIdx; i++) {
      await expect(page.getByTestId('btn-next-block')).toBeEnabled({ timeout: 5000 });
      await page.getByTestId('btn-next-block').click();
    }
    await page.getByTestId('btn-save-progress').click();
    await expect(page.getByTestId('save-status')).toBeVisible({ timeout: 10000 });

    // Refresh — resume persists
    await page.reload();
    await expect(page.getByTestId('lesson-title')).toBeVisible({ timeout: 10000 });
  });

  test('resume after logout and login', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await expect(page.getByTestId('course-title')).toBeVisible();

    await logoutViaApi(context);
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await page.getByTestId('btn-resume').click();
    await expect(page.getByTestId('lesson-title')).toBeVisible();
  });

  test('resume survives API restart', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await expect(page.getByTestId('course-title')).toBeVisible();

    const newPid = await restartApi(state.apiUrl);
    expect(newPid).toBeGreaterThan(0);

    await page.goto(`${state.webUrl}/learn/courses/${state.paidCourseSlug}`);
    await page.getByTestId('btn-resume').click();
    await expect(page.getByTestId('lesson-title')).toBeVisible();
  });

  test('quiz completion and lesson complete', async ({ page, context }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await resetLessonProgress(context, state.paidCourseLesson1Id);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();
    await expect(page.getByTestId('quiz-link')).toBeVisible({ timeout: 10000 });

    // Quiz
    await page.getByTestId('quiz-link').click();
    await page.getByLabel('4').click();
    await page.getByTestId('quiz-submit').click();
    await expect(page.getByTestId('quiz-result')).toContainText('passed', { timeout: 10000 });

    // Complete lesson
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();
    await expect(page.getByTestId('btn-complete-lesson')).toBeEnabled({ timeout: 10000 });
    await page.getByTestId('btn-complete-lesson').click();
    await expect(page.getByTestId('completion-badge')).toBeVisible({ timeout: 10000 });
  });

  test('interactive blocks: keyboard and accessibility', async ({ page, context, isMobile }) => {
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await verifyLessonData(context, state.paidCourseLesson1Id);
    await resetLessonProgress(context, state.paidCourseLesson1Id);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible();
    await expect(page.getByTestId('btn-next-block')).toBeEnabled({ timeout: 10000 });

    if (isMobile) await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to reveal block (position 3) — wait for each block to load
    await waitForBlock(page, 'block-audio');
    await waitForBlock(page, 'block-video');
    await waitForBlock(page, 'block-interactive');

    await expect(page.getByTestId('reveal-button')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('reveal-button').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('reveal-content')).toBeVisible();

    // Navigate to flashcard block (position 4)
    await waitForBlock(page, 'interactive-flashcard');
    const flashcard = page.getByTestId('interactive-flashcard');
    await flashcard.focus();
    await page.keyboard.press('Space');
    await expect(page.getByText('Back answer')).toBeVisible();
    await expect(flashcard).toHaveAttribute('tabindex', '0');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByTestId('lesson-title')).toBeVisible();
  });

  test('teacher notes: assigned sees notes, unassigned and student do not', async ({ page, context }) => {
    // Assigned teacher logs in and views lesson
    await loginViaApi(context, state.teacherEmail, state.teacherPassword);
    await verifyLessonData(context, state.paidCourseLesson1Id);
    await resetLessonProgress(context, state.paidCourseLesson1Id);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible({ timeout: 15000 });

    // Wait for the teacher-notes panel to appear
    const notesPanel = page.getByTestId('teacher-notes-panel');
    await expect(notesPanel).toBeVisible({ timeout: 10000 });
    await expect(notesPanel).toContainText('Teacher note content');

    await logoutViaApi(context);

    // Unassigned teacher cannot see the note
    await loginViaApi(context, state.otherTeacherEmail, state.otherTeacherPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('teacher-notes-panel')).toHaveCount(0);

    await logoutViaApi(context);

    // Student cannot see the secret note
    await loginViaApi(context, state.studentEmail, state.studentPassword);
    await page.goto(`${state.webUrl}/learn/lessons/${state.paidCourseLesson1Id}`);
    await expect(page.getByTestId('lesson-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('teacher-notes-panel')).toHaveCount(0);
  });
});
