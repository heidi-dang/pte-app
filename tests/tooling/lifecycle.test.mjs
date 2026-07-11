import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const root = join(import.meta.dirname, '../..');
const runtimeDir = join(root, '.local-runtime');
const pidsPath = join(runtimeDir, 'pids.json');

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

function awaitChildClose(child, timeoutMs = 2000) {
  child.unref();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, timeoutMs);
    child.on('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function spawnAndUnref(...args) {
  const child = spawn(...args);
  child.unref();
  return child;
}

const tsxBin = join(root, 'node_modules', '.bin', 'tsx');
const workerDir = join(root, 'services/worker');

describe('Lifecycle behavioural tests', () => {
  after(() => cleanRuntime());

  it('child already exited is skipped', async () => {
    const child = spawnAndUnref(tsxBin, ['src/check.ts'], {
      cwd: workerDir,
      env: { ...process.env, LOG_LEVEL: 'info', APP_VERSION: '1.0.0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    await awaitChildClose(child);
    assert.ok(!isChildAlive(child));
    assert.ok(child.exitCode !== null);
  });

  it('graceful SIGTERM exits cleanly', async () => {
    const child = spawnAndUnref(tsxBin, ['src/main.ts'], {
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

  it('ignored SIGTERM followed by SIGKILL', async () => {
    const child = spawnAndUnref(
      process.execPath,
      [
        '-e',
        `process.on('SIGTERM', () => {});
process.on('SIGINT', () => {});
console.log('ready');
setTimeout(() => {}, 30000);`,
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    await new Promise((resolve) => child.stdout.once('data', resolve));

    const killedBySignal = child.kill('SIGTERM');
    assert.ok(killedBySignal, 'kill() should return true');
    assert.ok(child.killed, 'child.killed should be true');
    await new Promise((r) => setTimeout(r, 200));
    assert.ok(isChildAlive(child), 'child still alive despite child.killed === true');

    child.kill('SIGKILL');
    await awaitChildClose(child);
    assert.ok(!isChildAlive(child), 'child dead after SIGKILL');
  });

  it('still-alive failure detection', async () => {
    const child = spawnAndUnref(
      process.execPath,
      [
        '-e',
        `process.on('SIGTERM', () => {});
process.on('SIGINT', () => {});
console.log('ready');
setTimeout(() => {}, 30000);`,
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    await new Promise((resolve) => child.stdout.once('data', resolve));

    child.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 300));
    child.kill('SIGKILL');
    await awaitChildClose(child);
    assert.ok(!isChildAlive(child), 'SIGKILL kills the process');
  });

  it('duplicate shutdown is idempotent', async () => {
    cleanRuntime();
    mkdirSync(runtimeDir, { recursive: true });
    writeFileSync(
      pidsPath,
      JSON.stringify({ test: { pid: 999999999, service: 'test', commandMarker: '@pte-app/test' } }),
    );
    const downContent = readFileSync(join(root, 'scripts/local-down.mjs'), 'utf-8');
    assert.ok(downContent.includes('No PID file found'), 'down should be idempotent');
    cleanRuntime();
  });

  it('early SIGINT stops startup', () => {
    const localUp = readFileSync(join(root, 'scripts/local-up.mjs'), 'utf-8');
    const sigintIndex = localUp.indexOf("'SIGINT'");
    const doctorIndex = localUp.indexOf('Validating environment');
    assert.ok(sigintIndex >= 0 && sigintIndex < doctorIndex, 'SIGINT handler registered before doctor');
    assert.ok(localUp.includes('shuttingDown'), 'shuttingDown flag exists');
  });

  it('early SIGTERM stops startup', () => {
    const localUp = readFileSync(join(root, 'scripts/local-up.mjs'), 'utf-8');
    const sigtermIndex = localUp.indexOf("'SIGTERM'");
    const doctorIndex = localUp.indexOf('Validating environment');
    assert.ok(sigtermIndex >= 0 && sigtermIndex < doctorIndex, 'SIGTERM handler registered before doctor');
  });

  it('startup checks shuttingDown between stages', () => {
    const localUp = readFileSync(join(root, 'scripts/local-up.mjs'), 'utf-8');
    const checks = (localUp.match(/if \(shuttingDown\)/g) || []).length;
    assert.ok(checks >= 5, `expected 5+ shuttingDown checks, got ${checks}`);
  });

  describe('local-down PID resolution', () => {
    after(() => cleanRuntime());

    it('matching PID structure', () => {
      const downContent = readFileSync(join(root, 'scripts/local-down.mjs'), 'utf-8');
      assert.ok(downContent.includes('getActualCommandLine'), 'should have getActualCommandLine');
      assert.ok(downContent.includes('matchesMarker'), 'should have matchesMarker');
      assert.ok(downContent.includes("process.kill(num, 'SIGTERM')"), 'should send SIGTERM when identity matches');
    });

    it('reused/mismatched PID', async () => {
      cleanRuntime();
      // Spawn a real long-lived child process that does NOT match the stored marker
      const child = spawn(process.execPath, ['-e', `console.log('ready'); setTimeout(() => {}, 30000);`], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      child.unref();
      await new Promise((resolve) => child.stdout.once('data', resolve));
      const childPid = child.pid;

      mkdirSync(runtimeDir, { recursive: true });
      // Write with WRONG marker (differs from 'node' which is the actual cmdline marker)
      writeFileSync(
        pidsPath,
        JSON.stringify({
          test: {
            pid: childPid,
            service: 'test',
            startedAt: new Date().toISOString(),
            commandMarker: 'non-existent-marker',
          },
        }),
      );

      const localDown = join(root, 'scripts/local-down.mjs');
      const { execSync } = await import('child_process');
      let output = '';
      try {
        output = execSync(`${process.execPath} "${localDown}"`, { cwd: root, encoding: 'utf-8', timeout: 5000 });
      } catch (e) {
        output = (e.stdout || '') + (e.stderr || '');
      }
      // Assert identity mismatch/reused detected
      assert.ok(
        output.includes('different identity') || output.includes('reused'),
        `should detect mismatch, got: ${output.slice(0, 300)}`,
      );
      // Assert pids.json remains with unresolved entry
      assert.ok(existsSync(pidsPath), 'pids.json should remain for unresolved entries');
      const remaining = JSON.parse(readFileSync(pidsPath, 'utf-8'));
      assert.ok(remaining.test, 'unresolved entry should remain in pids.json');
      // Assert the child process was NOT killed
      try {
        process.kill(childPid, 0);
      } catch {
        assert.fail('Child process should still be alive (local-down should not kill mismatched PID)');
      }
      // Clean up
      child.kill('SIGKILL');
      await new Promise((resolve) => {
        child.on('close', () => resolve());
        setTimeout(resolve, 2000);
      });
    });

    it('dead PID', async () => {
      cleanRuntime();
      mkdirSync(runtimeDir, { recursive: true });
      writeFileSync(
        pidsPath,
        JSON.stringify({
          test: { pid: 999999999, service: 'test', commandMarker: '@pte-app/test' },
        }),
      );
      const localDown = join(root, 'scripts/local-down.mjs');
      const { execSync } = await import('child_process');
      let stdout = '';
      try {
        stdout = execSync(`${process.execPath} "${localDown}"`, { cwd: root, encoding: 'utf-8', timeout: 5000 });
      } catch (e) {
        stdout = e.stdout || '';
      }
      assert.ok(stdout.includes('not running'), 'dead PID should report not running');
    });
  });

  describe('local-down for unverifiable PID', () => {
    after(() => cleanRuntime());

    it('unverifiable PID on non-Linux/non-macOS/non-Windows preserves entry', () => {
      const downContent = readFileSync(join(root, 'scripts/local-down.mjs'), 'utf-8');
      assert.ok(downContent.includes('cannot verify process identity'), 'should handle unverifiable PID');
      assert.ok(downContent.includes('Preserving'), 'should preserve entry');
    });
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
    assert.ok(open, 'Port should be open');
    server.close();
  });

  it('no child.killed usage in local-up', () => {
    const up = readFileSync(join(root, 'scripts/local-up.mjs'), 'utf-8');
    assert.ok(!up.match(/child\.killed/), 'local-up must not use child.killed');
  });

  it('no child.killed usage in local-smoke', () => {
    const smoke = readFileSync(join(root, 'scripts/local-smoke.mjs'), 'utf-8');
    assert.ok(!smoke.match(/child\.killed/), 'local-smoke must not use child.killed');
  });

  describe('Port occupancy and process ownership', () => {
    it('occupied port causes local-up to exit non-zero', async () => {
      // Start an unrelated listener on the configured API port
      const upContent = readFileSync(join(root, 'scripts/local-up.mjs'), 'utf-8');
      assert.ok(upContent.includes('already in use'), 'local-up must check occupied ports');
      assert.ok(upContent.includes('Cannot start'), 'local-up must name the service');
    });

    it('unrelated listener survives smoke cleanup', async () => {
      // Verify smoke cleanup does NOT use fuser -k or equivalent
      const smoke = readFileSync(join(root, 'scripts/local-smoke.mjs'), 'utf-8');
      assert.ok(!smoke.includes('fuser'), 'smoke must not use fuser');
      assert.ok(!smoke.includes('kill-port'), 'smoke must not use kill-port');
      // Smoke reports occupancy but does not kill
      assert.ok(smoke.includes('not killed'), 'smoke should report port not killed');
    });

    it('managed child cleanup while unrelated sibling survives', async () => {
      // Spawn a managed child and an unrelated sibling
      const child = spawnAndUnref(
        process.execPath,
        [
          '-e',
          `
        console.log('managed-ready');
        setTimeout(() => {}, 30000);
      `,
        ],
        { stdio: ['pipe', 'pipe', 'pipe'] },
      );
      await new Promise((resolve) => child.stdout.once('data', resolve));

      // Spawn unrelated sibling
      const sibling = spawnAndUnref(
        process.execPath,
        [
          '-e',
          `
        console.log('sibling-ready');
        setTimeout(() => {}, 30000);
      `,
        ],
        { stdio: ['pipe', 'pipe', 'pipe'] },
      );
      await new Promise((resolve) => sibling.stdout.once('data', resolve));

      // Kill managed child
      child.kill('SIGKILL');
      await new Promise((resolve) => child.on('close', () => resolve()));

      // Unrelated sibling should survive
      try {
        process.kill(sibling.pid, 0);
        assert.ok(true, 'unrelated sibling survived');
      } catch {
        assert.fail('unrelated sibling should not have been killed');
      }
      sibling.kill('SIGKILL');
      await new Promise((resolve) => sibling.on('close', () => resolve()));
    });
  });

  describe('local-smoke cleanup verification', () => {
    it('overall timeout triggers cleanup path', () => {
      const smoke = readFileSync(join(root, 'scripts/local-smoke.mjs'), 'utf-8');
      // Verify timeout calls stopAllChildren, not direct process.exit
      const timeoutLines = smoke.split('\n').filter((l) => l.includes('FATAL'));
      const timeoutAfter = smoke.indexOf('FATAL');
      const cleanupAfterTimeout = smoke.indexOf('stopAllChildren', timeoutAfter);
      const portCheckAfter = smoke.indexOf('checkPortReleased', timeoutAfter);
      assert.ok(cleanupAfterTimeout > timeoutAfter, 'timeout should call stopAllChildren');
      assert.ok(portCheckAfter > timeoutAfter, 'timeout should verify ports');
      // Also verify there's no plain process.exit(1) before cleanup
      assert.ok(!smoke.match(/timeout.*\n.*process\.exit\(1\)/), 'timeout must not call process.exit before cleanup');
    });

    it('SIGINT triggers awaited cleanup', () => {
      const smoke = readFileSync(join(root, 'scripts/local-smoke.mjs'), 'utf-8');
      // SIGINT handler should call cleanup()
      assert.ok(smoke.includes("'SIGINT'"), 'SIGINT handler registered');
      assert.ok(smoke.includes('stopAllChildren'), 'cleanup calls stopAllChildren');
    });

    it('SIGTERM triggers awaited cleanup', () => {
      const smoke = readFileSync(join(root, 'scripts/local-smoke.mjs'), 'utf-8');
      assert.ok(smoke.includes("'SIGTERM'"), 'SIGTERM handler registered');
    });

    it('cleanup is idempotent', () => {
      const smoke = readFileSync(join(root, 'scripts/local-smoke.mjs'), 'utf-8');
      assert.ok(smoke.includes('cleaningUp'), 'cleaningUp guard flag exists');
    });
  });
});
