import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer, type AddressInfo } from 'node:net';

const root = resolve(import.meta.dirname, '../../..');
const webDir = resolve(root, 'apps/web');

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, host);
  });
}

describe('Web integration', () => {
  if (!existsSync(resolve(webDir, '.next'))) {
    it('skipped - web not built', () => {
      console.log('Web not built, skipping integration test');
    });
    return;
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  let child: ChildProcess;
  let port: number;

  before(async () => {
    port = 0;
    child = spawn(npmCmd, ['run', 'start'], {
      cwd: webDir,
      stdio: 'pipe',
      env: { ...process.env, WEB_PORT: String(port) },
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for web')), 15000);
      child.stdout!.on('data', (data: Buffer) => {
        const text = data.toString();
        if (text.includes('started') || text.includes('listening') || text.includes('localhost')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      child.stderr!.on('data', (data: Buffer) => {
        const text = data.toString();
        if (text.includes('started') || text.includes('listening') || text.includes('localhost')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      child.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      child.on('exit', (code) => {
        clearTimeout(timeout);
        reject(new Error(`Web exited with code ${code}`));
      });
    });
  });

  after(async () => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          try {
            child.kill('SIGKILL');
          } catch {}
          resolve();
        }, 3000);
        child.on('close', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
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
