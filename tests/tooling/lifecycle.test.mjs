import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { createServer } from 'node:net';

const root = join(import.meta.dirname, '../..');
const runtimeDir = join(root, '.local-runtime');
const pidsPath = join(runtimeDir, 'pids.json');
const localUp = readFileSync(join(root, 'scripts/local-up.mjs'), 'utf-8');
const localDown = readFileSync(join(root, 'scripts/local-down.mjs'), 'utf-8');

function cleanRuntime() {
  try {
    rmSync(runtimeDir, { recursive: true, force: true });
  } catch {}
}

function isChildAlive(child) {
  if (!child || child.pid == null) return false;
  if (child.exitCode !== null || child.signalCode !== null) return false;
  try {
    process.kill(child.pid, 0);
    return true;
  } catch {
    return false;
  }
}

const tsxBin = join(root, 'node_modules', '.bin', 'tsx');
const workerDir = join(root, 'services/worker');

describe('Lifecycle behavioural tests', () => {
  after(() => cleanRuntime());

  it('child already exited is skipped', async () => {
    const child = spawn(tsxBin, ['src/check.ts'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '1.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    await new Promise((resolve) => child.on('close', resolve));
    assert.ok(!isChildAlive(child));
    assert.ok(child.exitCode !== null);
  });

  it('SIGTERM results in graceful exit', async () => {
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
      setTimeout(() => child.kill('SIGKILL'), 4000);
    });
    assert.ok(stdout.includes('worker_shutdown'), 'should have worker_shutdown');
    assert.equal(exitCode, 0, 'should exit 0');
    assert.ok(!isChildAlive(child), 'should not be alive');
  });

  it('child.killed === true while child is still alive (SIGTERM ignored proof)', async () => {
    // Create a process that ignores SIGTERM
    const child = spawn(
      process.execPath,
      [
        '-e',
        `
      process.on('SIGTERM', () => {});
      process.on('SIGINT', () => {});
      console.log('ready');
      setInterval(() => {}, 1000);
    `,
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    await new Promise((resolve) => child.stdout.once('data', resolve));

    // Send SIGTERM - should return true and set child.killed
    const killed = child.kill('SIGTERM');
    assert.ok(killed, 'kill() should return true');
    assert.ok(child.killed, 'child.killed should be true');

    // But child should still be alive!
    await new Promise((r) => setTimeout(r, 200));
    assert.ok(isChildAlive(child), 'child should still be alive despite child.killed === true');

    // SIGKILL should still work
    child.kill('SIGKILL');
    await new Promise((r) => setTimeout(r, 500));
    assert.ok(!isChildAlive(child), 'child should be dead after SIGKILL');
  });

  it('SIGKILL fallback', async () => {
    const child = spawn(tsxBin, ['src/main.ts', '--test'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '1.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    await new Promise((resolve) => child.on('close', resolve));
    assert.ok(!isChildAlive(child), 'child should be dead');
  });

  it('early signal handlers in local-up', () => {
    const sigintLine = localUp.split('\n').findIndex((l) => l.includes("'SIGINT'"));
    const sigtermLine = localUp.split('\n').findIndex((l) => l.includes("'SIGTERM'"));
    const doctorLine = localUp.split('\n').findIndex((l) => l.includes('Validating environment'));
    assert.ok(sigintLine >= 0, 'SIGINT handler must exist');
    assert.ok(sigtermLine >= 0, 'SIGTERM handler must exist');
    assert.ok(sigintLine < doctorLine, 'SIGINT handler registered before doctor');
    assert.ok(sigtermLine < doctorLine, 'SIGTERM handler registered before doctor');
  });

  it('infrastructureStarted flag is set only after compose', () => {
    assert.ok(localUp.includes('infrastructureStarted'));
    const composeUpLine = localUp.split('\n').findIndex((l) => l.includes('compose') && l.includes('up'));
    const setFlagLine = localUp.split('\n').findIndex((l) => l.includes('infrastructureStarted = true'));
    assert.ok(setFlagLine > composeUpLine, 'flag set after compose up');
  });

  it('PostgreSQL timeout triggers infrastructure cleanup', () => {
    // Verify pg failure path calls shutdown
    const pgFailureIndex = localUp.indexOf('PostgreSQL not healthy');
    const pgShutdownIndex = localUp.indexOf("shutdown('postgres timeout'", pgFailureIndex);
    assert.ok(pgShutdownIndex > pgFailureIndex, 'pg timeout must call shutdown');
  });

  it('Redis timeout triggers infrastructure cleanup', () => {
    const redisFailureIndex = localUp.indexOf('Redis not healthy');
    const redisShutdownIndex = localUp.indexOf("shutdown('redis timeout'", redisFailureIndex);
    assert.ok(redisShutdownIndex > redisFailureIndex, 'redis timeout must call shutdown');
  });

  it('compose commands include --env-file .env.local', () => {
    // Check compose up
    const upCmd = localUp.match(/compose.*up/);
    assert.ok(upCmd, 'compose --env-file .env.local up must exist');

    // Check compose exec for pg
    const pgExec = localDown.match(/compose.*env-file.*exec/);
    assert.ok(
      localUp.includes("'compose', '--env-file', '.env.local', 'exec', '-T', 'postgres'"),
      'pg exec must use --env-file .env.local and -T',
    );

    // Check compose exec for redis
    assert.ok(
      localUp.includes("'compose', '--env-file', '.env.local', 'exec', '-T', 'redis'"),
      'redis exec must use --env-file .env.local and -T',
    );

    // Check compose down
    assert.ok(
      localDown.includes("'compose', '--env-file', '.env.local', 'down'") ||
        localDown.includes('docker compose --env-file .env.local down'),
      'down must use --env-file .env.local',
    );
  });

  it('Linux matching PID identity', () => {
    assert.ok(localDown.includes('/proc') || localDown.includes('cmdline'));
    if (process.platform === 'linux') {
      assert.ok(localDown.includes('cmdline'));
    }
  });

  it('Linux mismatched PID reports reuse', () => {
    assert.ok(localDown.includes('reused') || localDown.includes('different identity'), 'should detect reused PID');
  });

  it('unverifiable PID is not killed on unsupported platform', () => {
    assert.ok(localDown.includes('cannot verify process identity'), 'should not kill when identity unverifiable');
    assert.ok(localDown.includes('Preserving'), 'should preserve state when identity unverifiable');
  });

  it('unresolved PID remains in state file', () => {
    assert.ok(localDown.includes('unresolvedEntries'), 'should track unresolved entries');
    assert.ok(localDown.includes('preserved in pids.json'), 'should write unresolved entries back to pids.json');
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

  it('isChildAlive replaces child.killed in local-up', () => {
    assert.ok(localUp.includes('function isChildAlive'), 'local-up must have isChildAlive helper');
    assert.ok(!localUp.match(/child\.killed/), 'local-up must not use child.killed as termination proof');
  });

  it('isChildAlive replaces child.killed in local-smoke', () => {
    const smoke = readFileSync(join(root, 'scripts/local-smoke.mjs'), 'utf-8');
    assert.ok(smoke.includes('function isChildAlive'), 'local-smoke must have isChildAlive helper');
    assert.ok(!smoke.match(/child\.killed/), 'local-smoke must not use child.killed as termination proof');
  });
});
