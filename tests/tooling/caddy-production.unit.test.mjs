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

  it('all three virtual hosts use TLS (not http:// prefix)', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    const httpHosts = content.split('\n').filter((l) => l.startsWith('http://'));
    assert.strictEqual(httpHosts.length, 0, 'No hosts should use http:// prefix (plaintext application)');
    assert.ok(content.includes('tls '), 'Must have tls directive with certificate paths');
  });

  it('certificate and key paths are configuration-driven', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    assert.ok(content.includes('/etc/caddy/certs/origin.pem'), 'Must reference origin.pem path');
    assert.ok(content.includes('/etc/caddy/certs/origin-key.pem'), 'Must reference origin-key.pem path');
  });

  it('port 80 serves health only (no application traffic)', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    const port80Section = content.split(':80')[1]?.split(':443')[0] || '';
    assert.ok(port80Section.includes('/health'), 'Port 80 block must serve health endpoint');
    assert.ok(!port80Section.includes('reverse_proxy'), 'Port 80 must not reverse-proxy application traffic');
  });

  it('port 443 handles application TLS', () => {
    const content = readFileSync(CADDYFILE, 'utf-8');
    assert.ok(content.includes(':443'), 'Must have port 443 listener');
  });
});
