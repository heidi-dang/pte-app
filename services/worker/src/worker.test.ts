import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync } from 'child_process';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '../../..');
const workerDir = resolve(root, 'services/worker');

function runWorker(
  args: string[],
  timeoutMs = 10000,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise) => {
    const child = spawn('node', args, {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'test' },
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
  it('Test mode exits cleanly', async () => {
    const { code, stdout } = await runWorker(['dist/main.js', '--test']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('worker_ready'));
  });

  it('SIGINT exits cleanly', async () => {
    const child = spawn('node', ['dist/main.js'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'test' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString();
    });
    await new Promise((r) => setTimeout(r, 500));
    child.kill('SIGINT');
    const code = await new Promise<number | null>((resolve) => {
      child.on('close', resolve);
      setTimeout(() => {
        child.kill('SIGKILL');
        resolve(null);
      }, 3000);
    });
    assert.equal(code, 0);
  });

  it('check script validates config', async () => {
    const { code, stdout } = await runWorker(['dist/check.js']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('Worker configuration valid'));
  });
});
