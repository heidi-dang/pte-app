import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const CADDYFILE = `${ROOT}/infrastructure/caddy/Caddyfile`;

describe('Caddy configuration', () => {
  it('Caddyfile exists', () => {
    assert.ok(existsSync(CADDYFILE), 'Caddyfile must exist');
  });

  it('configuration validates with all required env vars', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    assert.ok(content.includes('{$ACME_EMAIL'), 'Must use ACME_EMAIL placeholder');
    assert.ok(content.includes('{$WEB_DOMAIN') || content.includes('pte.tnaprovider.com.au'), 'Must use WEB_DOMAIN');
    assert.ok(content.includes('{$API_DOMAIN') || content.includes('api.tnaprovider.com.au'), 'Must use API_DOMAIN');
    assert.ok(
      content.includes('{$SCORING_DOMAIN') || content.includes('scoring.tnaprovider.com.au'),
      'Must use SCORING_DOMAIN',
    );
    assert.ok(content.includes('{$WEB_UPSTREAM') || content.includes('web:3000'), 'Must use WEB_UPSTREAM');
    assert.ok(content.includes('{$API_UPSTREAM') || content.includes('api:4000'), 'Must use API_UPSTREAM');
    assert.ok(content.includes('{$SCORING_UPSTREAM') || content.includes('scoring:5000'), 'Must use SCORING_UPSTREAM');
  });

  it('all three host routes exist', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    const vhostCount = (content.match(/reverse_proxy/g) || []).length;
    assert.strictEqual(vhostCount, 3, 'Must have three reverse_proxy directives');
  });

  it('API preflight works (CORS not set by proxy)', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    assert.ok(!content.includes('Access-Control-Allow-Origin'), 'Caddy must not set CORS headers');
    assert.ok(!content.includes('Access-Control-Allow-Credentials'), 'Caddy must not set credential headers');
  });

  it('uses default reverse_proxy headers (no custom header_up)', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    const headerUpLines = content.split('\n').filter((l) => l.trim().startsWith('header_up'));
    assert.strictEqual(headerUpLines.length, 0, 'Caddy should use default reverse_proxy headers, not custom header_up');
  });

  it('admin is disabled', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    assert.ok(content.includes('admin off'), 'Admin endpoint must be disabled');
  });

  it('uses structured JSON logging', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    assert.ok(content.includes('format json'), 'Must use JSON log format');
  });
});
