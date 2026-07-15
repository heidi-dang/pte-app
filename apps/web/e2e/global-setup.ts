import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvLocal, applyEnvLocal } from '@pte-app/database/testing/env';
import { loadDatabaseConfig, createConnection, type DatabaseConnection } from '@pte-app/database';
import { setupTestDatabase } from '@pte-app/database/testing/setup';
import { buildFixtures, createEntitlement, createPrerequisite, type TestFixtures } from './test-fixtures';
import type { LessonId } from '@pte-app/contracts';

applyEnvLocal();

export const STATE_PATH = resolve(process.cwd(), 'e2e-state.json');

export interface E2EState {
  runId: string;
  apiUrl: string;
  webUrl: string;
  apiPid: number;
  webPid: number;
  adminEmail: string;
  adminPassword: string;
  adminId: string;
  studentEmail: string;
  studentPassword: string;
  studentId: string;
  teacherEmail: string;
  teacherPassword: string;
  teacherId: string;
  otherTeacherEmail: string;
  otherTeacherPassword: string;
  otherTeacherId: string;
  freeCourseSlug: string;
  paidCourseSlug: string;
  freeCourseId: string;
  paidCourseId: string;
  lesson1Id: string;
  lesson2Id: string;
  lessonVersionId: string;
  blockIds: string[];
  quizId: string;
  quizItemId: string;
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = addr && typeof addr === 'object' ? addr.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForUrl(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return true;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function spawnService(
  name: string,
  cwd: string,
  command: string,
  args: string[],
  env: Record<string, string>,
): ChildProcess {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, [command, ...args], { cwd, stdio: 'pipe', env: env as any, detached: true });
  (child.stdout as NodeJS.ReadableStream)?.on('data', (d: Buffer) => process.stdout.write(`[${name}] ${d}`));
  (child.stderr as NodeJS.ReadableStream)?.on('data', (d: Buffer) => process.stderr.write(`[${name}] ${d}`));
  return child;
}

async function startServices(
  testDbName: string,
): Promise<{ apiUrl: string; webUrl: string; api: ChildProcess; web: ChildProcess }> {
  const apiPort = await getAvailablePort();
  const webPort = await getAvailablePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const webUrl = `http://127.0.0.1:${webPort}`;
  const env = loadEnvLocal();
  const serviceEnv = {
    ...process.env,
    ...env,
    POSTGRES_DATABASE: testDbName,
    API_PORT: String(apiPort),
    API_HOST: '127.0.0.1',
    WEB_PORT: String(webPort),
    WEB_HOST: '127.0.0.1',
    NEXT_PUBLIC_API_URL: apiUrl,
    NODE_ENV: 'test',
  };

  const root = process.cwd();
  const api = spawnService('api', resolve(root, '../../services/api'), 'run', ['start'], serviceEnv);
  const apiReady = await waitForUrl(`${apiUrl}/health/live`, 30000);
  if (!apiReady) throw new Error('API did not start');

  const web = spawnService('web', resolve(root, '.'), 'run', ['start'], serviceEnv);
  const webReady = await waitForUrl(webUrl, 30000);
  if (!webReady) throw new Error('Web did not start');

  return { apiUrl, webUrl, api, web };
}

async function createPrereqForFreeCourse(db: DatabaseConnection, fixtures: TestFixtures): Promise<void> {
  await createPrerequisite(
    db,
    fixtures.freeCourse.lessonIds[1] as LessonId,
    fixtures.freeCourse.lessonIds[0] as LessonId,
    fixtures.admin.id,
  );
}

async function main(): Promise<void> {
  const baseConfig = loadDatabaseConfig();
  const testDbName = `${baseConfig.database}_test`;
  await setupTestDatabase(baseConfig);

  const { apiUrl, webUrl, api, web } = await startServices(testDbName);

  const testConfig = { ...baseConfig, database: testDbName };
  const db = await createConnection(testConfig);
  try {
    const runId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fixtures = await buildFixtures(db, { runId });
    await createEntitlement(db, fixtures.student.id, fixtures.paidCourse.id);
    await createPrereqForFreeCourse(db, fixtures);

    const lesson1 = await fetch(`${apiUrl}/learn/lessons/${fixtures.freeCourse.lessonIds[0]}`, {
      headers: {
        Authorization: `Bearer ${(await login(fixtures.student.email, fixtures.student.password, apiUrl)).token}`,
      },
    }).then((r) => r.json());

    const state: E2EState = {
      runId,
      apiUrl,
      webUrl,
      apiPid: api.pid ?? 0,
      webPid: web.pid ?? 0,
      adminEmail: fixtures.admin.email,
      adminPassword: 'AdminPass123',
      adminId: fixtures.admin.id,
      studentEmail: fixtures.student.email,
      studentPassword: 'StudentPass123',
      studentId: fixtures.student.id,
      teacherEmail: fixtures.teacher.email,
      teacherPassword: 'TeacherPass123',
      teacherId: fixtures.teacher.id,
      otherTeacherEmail: fixtures.otherTeacher.email,
      otherTeacherPassword: 'TeacherPass123',
      otherTeacherId: fixtures.otherTeacher.id,
      freeCourseSlug: fixtures.freeCourse.slug,
      paidCourseSlug: fixtures.paidCourse.slug,
      freeCourseId: fixtures.freeCourse.id,
      paidCourseId: fixtures.paidCourse.id,
      lesson1Id: fixtures.freeCourse.lessonIds[0] as LessonId,
      lesson2Id: fixtures.freeCourse.lessonIds[1] as LessonId,
      lessonVersionId: lesson1.lesson.versionId,
      blockIds: fixtures.freeCourse.blockIds,
      quizId: fixtures.freeCourse.quizId,
      quizItemId: fixtures.freeCourse.quizItemId,
    };

    if (!existsSync(resolve(process.cwd(), '.local-runtime'))) mkdirSync(resolve(process.cwd(), '.local-runtime'));
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    writeFileSync(
      resolve(process.cwd(), '.local-runtime/pids.json'),
      JSON.stringify(
        {
          api: { pid: api.pid, service: 'api', startedAt: new Date().toISOString() },
          web: { pid: web.pid, service: 'web', startedAt: new Date().toISOString() },
        },
        null,
        2,
      ),
    );
  } finally {
    await db.close();
  }
}

async function login(email: string, password: string, apiUrl: string): Promise<{ token: string }> {
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { token: data.token };
}

export default main;
