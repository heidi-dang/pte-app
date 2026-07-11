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
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise) => {
    const binary = args[0] && (args[0].includes('src/') || args[0].includes('.ts')) ? tsxBin : 'node';
    const child = spawn(binary, args, {
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
    const { code, stdout } = await runWorker(['src/main.ts', '--test']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('worker_ready'));
  });

  it('check script validates config', async () => {
    const { code, stdout } = await runWorker(['src/check.ts']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('Worker configuration valid'));
  });
});
