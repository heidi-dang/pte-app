import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvLocal, applyEnvLocal } from '@pte-app/database/testing/env';
import { loadDatabaseConfig, createConnection, type DatabaseConnection } from '@pte-app/database';
import { setupTestDatabase } from '@pte-app/database/testing/setup';
import { buildFixtures, createEntitlement, createPrerequisite, type TestFixtures } from './test-fixtures';
import type { LessonId } from '@pte-app/contracts';

applyEnvLocal();

export const STATE_PATH = resolve(process.cwd(), 'e2e-state.json');
const RUNTIME_DIR = resolve(process.cwd(), '.local-runtime');

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
  freeCourseId: string;
  freeCourseLesson1Id: string;
  freeCourseLesson2Id: string;
  freeCourseLesson1VersionId: string;
  freeCourseBlockIds: string[];
  freeCourseQuizId: string;
  paidCourseSlug: string;
  paidCourseId: string;
  paidCourseLesson1Id: string;
  paidCourseLesson2Id: string;
  paidCourseLesson1VersionId: string;
  paidCourseBlockIds: string[];
  paidCourseQuizId: string;
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeLog(label: string, line: string) {
  ensureDir(RUNTIME_DIR);
  appendFileSync(resolve(RUNTIME_DIR, `e2e-${label}.log`), line);
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
      // ignore transient health check failures
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
  child.stdout?.on('data', (d: Buffer) => {
    const text = d.toString();
    process.stdout.write(`[${name}] ${text}`);
    writeLog(name, text);
  });
  child.stderr?.on('data', (d: Buffer) => {
    const text = d.toString();
    process.stderr.write(`[${name}] ${text}`);
    writeLog(name, text);
  });
  child.on('exit', (code, signal) => {
    writeLog(name, `[${name}] process exited code=${code} signal=${signal}\n`);
  });
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
  if (!apiReady) {
    api.kill('SIGKILL');
    throw new Error(
      `API did not become ready at ${apiUrl} (port ${apiPort}, pid ${api.pid ?? 'unknown'}, exit code ${api.exitCode ?? 'N/A'}, signal ${api.signalCode ?? 'N/A'})`,
    );
  }

  const web = spawnService('web', resolve(root, '.'), 'run', ['start'], serviceEnv);
  const webReady = await waitForUrl(webUrl, 60000);
  if (!webReady) {
    api.kill('SIGKILL');
    web.kill('SIGKILL');
    throw new Error(
      `Web did not become ready at ${webUrl} (port ${webPort}, pid ${web.pid ?? 'unknown'}, exit code ${web.exitCode ?? 'N/A'}, signal ${web.signalCode ?? 'N/A'})`,
    );
  }

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

async function login(email: string, password: string, apiUrl: string): Promise<{ token: string }> {
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${data.error ?? res.statusText}`);
  return { token: data.token };
}

interface LessonData {
  lesson: { id: string; versionId: string };
  blocks: Array<{ id: string }>;
}

async function fetchLesson(apiUrl: string, token: string, lessonId: string): Promise<LessonData> {
  const res = await fetch(`${apiUrl}/learn/lessons/${lessonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to fetch lesson ${lessonId}: ${data.error ?? res.statusText}`);
  return data as LessonData;
}

async function main(): Promise<void> {
  ensureDir(RUNTIME_DIR);

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

    const token = (await login(fixtures.student.email, fixtures.student.password, apiUrl)).token;

    const freeLesson1 = await fetchLesson(apiUrl, token, fixtures.freeCourse.lessonIds[0] as string);
    const paidLesson1 = await fetchLesson(apiUrl, token, fixtures.paidCourse.lessonIds[0] as string);

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
      freeCourseId: fixtures.freeCourse.id,
      freeCourseLesson1Id: fixtures.freeCourse.lessonIds[0] as string,
      freeCourseLesson2Id: fixtures.freeCourse.lessonIds[1] as string,
      freeCourseLesson1VersionId: freeLesson1.lesson.versionId,
      freeCourseBlockIds: freeLesson1.blocks.map((b) => b.id),
      freeCourseQuizId: fixtures.freeCourse.quizId,
      paidCourseSlug: fixtures.paidCourse.slug,
      paidCourseId: fixtures.paidCourse.id,
      paidCourseLesson1Id: fixtures.paidCourse.lessonIds[0] as string,
      paidCourseLesson2Id: fixtures.paidCourse.lessonIds[1] as string,
      paidCourseLesson1VersionId: paidLesson1.lesson.versionId,
      paidCourseBlockIds: paidLesson1.blocks.map((b) => b.id),
      paidCourseQuizId: fixtures.paidCourse.quizId,
    };

    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    writeFileSync(
      resolve(RUNTIME_DIR, 'pids.json'),
      JSON.stringify(
        {
          api: { pid: api.pid, service: 'api', port: new URL(apiUrl).port, startedAt: new Date().toISOString() },
          web: { pid: web.pid, service: 'web', port: new URL(webUrl).port, startedAt: new Date().toISOString() },
        },
        null,
        2,
      ),
    );
  } finally {
    await db.close();
  }
}

export default main;
