import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:net';

const root = resolve(import.meta.dirname, '../../../..');
const webDir = resolve(root, 'apps/web');

function getAvailablePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const addr = s.address();
      const port = addr && typeof addr === 'object' ? addr.port : 0;
      s.close(() => resolve(port));
    });
  });
}

describe('Web integration', () => {
  if (!existsSync(resolve(webDir, '.next'))) {
    it('build web workspace first via turbo', () => {
      assert.fail('Web not built. Run `npm run build` ensures build runs first via turbo dependency.');
    });
    return;
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  let child: ChildProcess;
  let port: number;

  before(async () => {
    port = await getAvailablePort();
    child = spawn(npmCmd, ['run', 'start'], {
      cwd: webDir,
      stdio: 'pipe',
      env: { ...process.env, WEB_PORT: String(port) },
      detached: true,
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for web')), 15000);
      const onData = (data: Buffer) => {
        const text = data.toString();
        if (text.includes('started') || text.includes('listening') || text.includes('localhost')) {
          clearTimeout(timeout);
          child.stdout?.removeListener('data', onData);
          child.stderr?.removeListener('data', onData);
          resolve();
        }
      };
      child.stdout?.on('data', onData);
      child.stderr?.on('data', onData);
      child.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
      child.on('exit', (code: number | null) => {
        clearTimeout(timeout);
        reject(new Error(`Web exited with code ${code}`));
      });
    });
  });

  async function killChild() {
    if (!child || child.killed || child.exitCode !== null) return;
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 5000);
      child.on('close', () => { clearTimeout(timer); resolve(); });
    });
    if (child.exitCode === null && !child.killed) {
      try { process.kill(-child.pid, 'SIGKILL'); } catch {}
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2000);
        child.on('close', () => { clearTimeout(timer); resolve(); });
      });
    }
  }

  async function waitPortReleased(maxWait = 10000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const released = await new Promise<boolean>((resolve) => {
        const s = createServer();
        s.once('error', () => resolve(false));
        s.once('listening', () => { s.close(); resolve(true); });
        s.listen(port, '127.0.0.1');
      });
      if (released) return true;
      await new Promise((r) => setTimeout(r, 300));
    }
    return false;
  }

  after(async () => {
    await killChild();
    const released = await waitPortReleased();
    assert.ok(released, `Port ${port} should be released after close`);
  });

  it('returns HTTP 200', async () => {
    const res = await fetch(`http://127.0.0.1:${port}`);
    assert.equal(res.status, 200);
  });

  it('contains product heading', async () => {
    const text = await (await fetch(`http://127.0.0.1:${port}`)).text();
    assert.ok(text.includes('PTE Academic Platform'));
  });

  it('contains Development Environment heading', async () => {
    const text = await (await fetch(`http://127.0.0.1:${port}`)).text();
    assert.ok(text.includes('Development Environment'));
  });

  it('contains Phase B notice', async () => {
    const text = await (await fetch(`http://127.0.0.1:${port}`)).text();
    assert.ok(text.includes('Phase B'));
  });

  it('contains retry control', async () => {
    const text = await (await fetch(`http://127.0.0.1:${port}`)).text();
    assert.ok(text.includes('Retry'));
  });

  it('contains API and scoring links', async () => {
    const text = await (await fetch(`http://127.0.0.1:${port}`)).text();
    assert.ok(text.includes('API') || text.includes('api_url'));
  });
});
