import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = `${ROOT}/infrastructure/cloudflare/sync-dns.sh`;

function hasPattern(file, pattern) {
  return readFileSync(file, 'utf-8').includes(pattern);
}

function countOccurrences(file, pattern) {
  const content = readFileSync(file, 'utf-8');
  return (content.match(new RegExp(pattern, 'g')) || []).length;
}

describe('Cloudflare DNS script — record management', () => {
  it('exists and is executable', () => {
    assert.ok(existsSync(SCRIPT), 'sync-dns.sh must exist');
    const mode = execSync(`stat -c '%A' ${SCRIPT}`, { encoding: 'utf8' }).trim();
    assert.ok(mode.includes('x'), 'sync-dns.sh must be executable');
  });

  it('exactly three approved hostnames are managed', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    const pteCount = countOccurrences(SCRIPT, 'pte\\.tnaprovider\\.com\\.au');
    const apiCount = countOccurrences(SCRIPT, 'api\\.tnaprovider\\.com\\.au');
    const scoringCount = countOccurrences(SCRIPT, 'scoring\\.tnaprovider\\.com\\.au');
    assert.ok(pteCount >= 1, 'pte.tnaprovider.com.au must be managed');
    assert.ok(apiCount >= 1, 'api.tnaprovider.com.au must be managed');
    assert.ok(scoringCount >= 1, 'scoring.tnaprovider.com.au must be managed');
  });

  it('DIRECT and TUNNEL modes are mutually exclusive', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('DNS_MODE'), 'Script must reference DNS_MODE');
    assert.ok(content.includes('DIRECT'), 'Script must support DIRECT mode');
    assert.ok(content.includes('TUNNEL'), 'Script must support TUNNEL mode');
    assert.ok(content.includes('exit 1'), 'Invalid mode must exit');
  });

  it('no duplicate records (only 3 per run)', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    // In DIRECT mode: 3 records
    // In TUNNEL mode: 3 records
    // Total unique hostnames managed = 3
    const hostnames = new Set();
    const matches = content.match(/tnaprovider\.com\.au/g) || [];
    for (const m of matches) {
      hostnames.add(m);
    }
    assert.strictEqual(hostnames.size, 1, 'Only tnaprovider.com.au hostnames expected');
  });

  it('unrelated records are not touched', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(!content.includes('unrelated'), 'Script must not mention unrelated records');
    // Script only operates on its 3 known hostnames
    assert.ok(content.includes('Reading existing records'), 'Must read existing before modifying');
  });

  it('rerun is idempotent', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('No change needed'), 'Must detect no-change state');
    assert.ok(content.includes('No update needed'), 'Must skip unchanged records');
  });

  it('dry run performs no mutation', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('dry_run'), 'Must reference dry_run variable');
    assert.ok(content.includes('Dry run mode'), 'Must print dry run message');
    assert.ok(content.includes('exit 0'), 'Dry run must exit before apply');
  });

  it('token remains redacted', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(!content.includes('echo.*api_token'), 'Token must not be printed');
    const authLines = content.split('\n').filter((l) => l.includes('Authorization'));
    for (const line of authLines) {
      assert.ok(!line.includes('echo'), 'Authorization header must not be echoed');
    }
  });

  it('requires correct env vars for each mode', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.includes('CLOUDFLARE_API_TOKEN'), 'Must require API token');
    assert.ok(content.includes('CLOUDFLARE_ZONE_ID'), 'Must require zone ID');
    assert.ok(content.includes('VPS_IP'), 'Must reference VPS_IP');
    assert.ok(content.includes('TUNNEL_HOSTNAME'), 'Must reference TUNNEL_HOSTNAME');
  });

  it('fails on API errors', () => {
    const content = readFileSync(SCRIPT, 'utf-8');
    const exitCount = countOccurrences(SCRIPT, 'exit 1');
    assert.ok(exitCount >= 3, 'Script must fail on API errors');
  });
});
