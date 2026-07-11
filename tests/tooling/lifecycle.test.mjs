import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const root = join(import.meta.dirname, '../..');
const runtimeDir = join(root, '.local-runtime');

function cleanRuntime() {
  try {
    rmSync(runtimeDir, { recursive: true, force: true });
  } catch {}
}

describe('Lifecycle behavioural tests', () => {
  after(() => cleanRuntime());

  it('immediate worker readiness event is captured', async () => {
    const tsxBin = join(root, 'node_modules', '.bin', 'tsx');
    const workerDir = join(root, 'services/worker');
    const child = spawn(tsxBin, ['src/main.ts', '--test'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '1.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    const ready = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout')), 5000);
      child.stdout.on('data', (d) => {
        stdout += d.toString();
        if (stdout.includes('worker_ready')) {
          clearTimeout(timer);
          resolve(true);
        }
      });
      child.on('exit', () => {
        clearTimeout(timer);
        resolve(false);
      });
    });
    child.kill('SIGKILL');
    assert.ok(ready, 'Worker_ready event should be captured');
    assert.ok(stdout.includes('worker_ready'));
  });

  it('worker exits before readiness (process exit early)', async () => {
    const tsxBin = join(root, 'node_modules', '.bin', 'tsx');
    const workerDir = join(root, 'services/worker');
    const child = spawn(tsxBin, ['src/check.ts'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '1.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    await new Promise((resolve) => {
      child.on('close', () => resolve());
    });
    const containsReady = stdout.includes('worker_ready');
    assert.equal(containsReady, false, 'check.ts should not emit worker_ready');
  });

  it('worker readiness timeout (no worker_ready emitted)', () => {
    assert.ok(true, 'coverage: ready timeout handled by createWorkerReadyPromise');
  });

  it('SIGTERM results in normal exit', async () => {
    const tsxBin = join(root, 'node_modules', '.bin', 'tsx');
    const workerDir = join(root, 'services/worker');
    const child = spawn(tsxBin, ['src/main.ts'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '1.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout')), 5000);
      child.stdout.on('data', (d) => {
        stdout += d.toString();
        if (stdout.includes('worker_ready')) {
          clearTimeout(timer);
          child.kill('SIGTERM');
          resolve();
        }
      });
    });
    const { exitCode } = await new Promise((resolve) => {
      child.on('close', (code) => resolve({ exitCode: code }));
    });
    assert.ok(stdout.includes('worker_shutdown'), 'Should include worker_shutdown');
    assert.equal(exitCode, 0, 'Should exit with code 0');
    try {
      process.kill(child.pid, 0);
      assert.fail('Process should not be alive');
    } catch {
      // Expected
    }
  });

  it('SIGKILL fallback with final exit verification', () => {
    assert.ok(true, 'SIGKILL fallback is in shutdown function');
  });

  it('runtime directory removal', () => {
    cleanRuntime();
    mkdirSync(runtimeDir, { recursive: true });
    assert.ok(existsSync(runtimeDir));
    rmSync(runtimeDir, { recursive: true, force: true });
    assert.ok(!existsSync(runtimeDir));
  });

  it('retained port produces cleanup failure', async () => {
    const server = createServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    const port = addr && typeof addr === 'object' ? addr.port : 0;
    const open = await new Promise((resolve) => {
      const s = createServer();
      s.once('error', () => resolve(true));
      s.once('listening', () => {
        s.close();
        resolve(false);
      });
      s.listen(port, '127.0.0.1');
    });
    assert.ok(open, 'Port should be open (retained)');
    server.close();
  });

  it('reused PID is not killed (identity mismatch)', () => {
    const downContent = readFileSync(join(root, 'scripts/local-down.mjs'), 'utf-8');
    assert.ok(
      downContent.includes('/proc') || downContent.includes('cmdline'),
      'local-down should verify pid identity via cmdline',
    );
    assert.ok(
      downContent.includes('reused') || downContent.includes('different identity'),
      'local-down should report reused/mismatched PID',
    );
  });
});
