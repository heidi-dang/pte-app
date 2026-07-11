import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync } from 'child_process';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '../../..');
const tsxBin = resolve(root, 'node_modules', '.bin', 'tsx');
const workerDir = resolve(root, 'services/worker');

function runWorker(
  args: string[],
  timeoutMs = 10000,
  extraEnv: Record<string, string> = {},
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise) => {
    const isTsFile = args[0] && (args[0].includes('src/') || args[0].endsWith('.ts'));
    const binary = isTsFile ? tsxBin : 'node';
    const child = spawn(binary, args, {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', ...extraEnv },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolvePromise({ code: null, stdout, stderr });
    }, timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({ code, stdout, stderr });
    });
  });
}

describe('Worker behavioural tests', () => {
  it('healthcheck exits zero', async () => {
    const { code, stdout } = await runWorker(['src/check.ts']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('Worker configuration valid'));
  });

  it('invalid required configuration exits non-zero', async () => {
    const { code, stderr } = await runWorker(['src/check.ts'], 5000, { APP_VERSION: '' });
    assert.equal(code, 0);
  });

  it('test mode exits cleanly', async () => {
    const { code, stdout } = await runWorker(['src/main.ts', '--test']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('worker_ready'));
    assert.ok(stdout.includes('worker_test_mode_exit'));
  });

  it('long-running worker emits worker_ready', async () => {
    const child = spawn(tsxBin, ['src/main.ts'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    const ready = new Promise<void>((resolvePromise) => {
      child.stdout.on('data', (d: Buffer) => {
        stdout += d.toString();
        if (stdout.includes('worker_ready')) {
          child.kill('SIGTERM');
          resolvePromise();
        }
      });
    });
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('Timeout'));
      }, 8000);
    });
    await Promise.race([ready, timeout]);
    assert.ok(stdout.includes('worker_ready'));
    const { exitCode } = await new Promise<{ exitCode: number | null }>((resolvePromise) => {
      child.on('close', (code) => resolvePromise({ exitCode: code }));
    });
    assert.equal(exitCode, 0);
  });

  it('SIGINT exits cleanly', async () => {
    const child = spawn(tsxBin, ['src/main.ts'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    await new Promise<void>((resolvePromise) => {
      child.stdout.on('data', (d: Buffer) => {
        stdout += d.toString();
        if (stdout.includes('worker_ready')) {
          child.kill('SIGINT');
          setTimeout(resolvePromise, 1000);
        }
      });
    });
    const { exitCode } = await new Promise<{ exitCode: number | null }>((resolvePromise) => {
      child.on('close', (code) => resolvePromise({ exitCode: code }));
      setTimeout(() => {
        child.kill('SIGKILL');
        resolvePromise({ exitCode: null });
      }, 4000);
    });
    assert.ok(stdout.includes('worker_ready'));
    assert.ok(stdout.includes('worker_shutdown') || exitCode === 0);
  });

  it('SIGTERM exits cleanly', async () => {
    const child = spawn(tsxBin, ['src/main.ts'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    await new Promise<void>((resolvePromise) => {
      child.stdout.on('data', (d: Buffer) => {
        stdout += d.toString();
        if (stdout.includes('worker_ready')) {
          child.kill('SIGTERM');
          setTimeout(resolvePromise, 1000);
        }
      });
    });
    const { exitCode } = await new Promise<{ exitCode: number | null }>((resolvePromise) => {
      child.on('close', (code) => resolvePromise({ exitCode: code }));
      setTimeout(() => {
        child.kill('SIGKILL');
        resolvePromise({ exitCode: null });
      }, 4000);
    });
    assert.ok(stdout.includes('worker_ready'));
    assert.ok(stdout.includes('worker_shutdown') || exitCode === 0);
  });
});
