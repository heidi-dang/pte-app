import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'child_process';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '../../..');
const tsxBin = resolve(root, 'node_modules', '.bin', 'tsx');
const workerDir = resolve(root, 'services/worker');

const spawned: ChildProcess[] = [];

after(() => {
  for (const child of spawned) {
    if (!child.killed && child.exitCode === null) {
      try {
        child.kill('SIGKILL');
      } catch {}
    }
  }
});

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
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '0.0.0', ...extraEnv },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    spawned.push(child);
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

function waitForReady(child: ChildProcess, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout waiting for worker_ready'));
    }, timeoutMs);

    function onData(d: Buffer) {
      stdout += d.toString();
      if (stdout.includes('worker_ready')) {
        cleanup();
        resolve(stdout);
      }
    }

    function onExit(code: number | null) {
      cleanup();
      reject(new Error(`Worker exited before ready with code ${code}`));
    }

    function cleanup() {
      clearTimeout(timer);
      child.stdout?.removeListener('data', onData);
      child.stderr?.removeListener('data', onData);
      child.removeListener('exit', onExit);
    }

    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('exit', onExit);
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
    assert.notEqual(code, 0);
    assert.ok(stderr.includes('APP_VERSION'), `stderr should name APP_VERSION: ${stderr}`);
  });

  it('test mode exits cleanly', async () => {
    const { code, stdout } = await runWorker(['src/main.ts', '--test']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('worker_ready'));
    assert.ok(stdout.includes('worker_test_mode_exit'));
  });

  it('immediate worker_ready event is captured', async () => {
    const child = spawn(tsxBin, ['src/main.ts', '--test'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '0.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    spawned.push(child);
    const stdout = await waitForReady(child, 5000);
    assert.ok(stdout.includes('worker_ready'));
    // Verify clean exit
    const { exitCode } = await new Promise<{ exitCode: number | null }>((resolve) => {
      child.on('close', (code) => resolve({ exitCode: code }));
    });
    assert.equal(exitCode, 0);
  });

  it('long-running worker emits worker_ready', async () => {
    const child = spawn('node', ['dist/main.js'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '0.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    spawned.push(child);
    const stdout = await waitForReady(child, 8000);
    assert.ok(stdout.includes('worker_ready'));
    child.kill('SIGTERM');
    const { exitCode } = await new Promise<{ exitCode: number | null }>((resolve) => {
      child.on('close', (code) => resolve({ exitCode: code }));
    });
    assert.equal(exitCode, 0);
  });

  it('SIGINT emits worker_shutdown and exits zero', async () => {
    const child = spawn('node', ['dist/main.js'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '0.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    spawned.push(child);
    // Wait for ready
    await waitForReady(child, 8000);
    // Clear stdout and send SIGINT
    child.kill('SIGINT');
    const { stdout, exitCode } = await new Promise<{ stdout: string; exitCode: number | null }>((resolve, reject) => {
      let stdout = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('SIGINT timeout'));
      }, 4000);
      child.stdout?.on('data', (d: Buffer) => {
        stdout += d.toString();
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout, exitCode: code });
      });
    });
    assert.ok(stdout.includes('worker_shutdown'), `stdout should contain worker_shutdown: ${stdout}`);
    assert.equal(exitCode, 0);
    // Confirm child is no longer alive
    try {
      process.kill(child.pid!, 0);
      assert.fail('Child should not be alive after SIGINT');
    } catch {
      // Expected - process is gone
    }
  });

  it('SIGTERM emits worker_shutdown and exits zero', async () => {
    const child = spawn('node', ['dist/main.js'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '0.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    spawned.push(child);
    await waitForReady(child, 8000);
    child.kill('SIGTERM');
    const { stdout, exitCode } = await new Promise<{ stdout: string; exitCode: number | null }>((resolve, reject) => {
      let stdout = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('SIGTERM timeout'));
      }, 4000);
      child.stdout?.on('data', (d: Buffer) => {
        stdout += d.toString();
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout, exitCode: code });
      });
    });
    assert.ok(stdout.includes('worker_shutdown'), `stdout should contain worker_shutdown: ${stdout}`);
    assert.equal(exitCode, 0);
    try {
      process.kill(child.pid!, 0);
      assert.fail('Child should not be alive after SIGTERM');
    } catch {
      // Expected
    }
  });
});
