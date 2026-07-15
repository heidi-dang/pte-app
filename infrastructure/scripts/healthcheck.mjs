#!/usr/bin/env node
import http from 'node:http';

const url = process.argv[2];
const timeoutMs = parseInt(process.argv[3] || '5000', 10);
const expectedStatus = parseInt(process.argv[4] || '200', 10);
const retries = parseInt(process.argv[5] || '1', 10);
const retryDelayMs = parseInt(process.argv[6] || '1000', 10);

if (!url) {
  console.error('Usage: healthcheck.mjs <url> [timeoutMs] [expectedStatus] [retries] [retryDelayMs]');
  process.exit(1);
}

async function check() {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: timeoutMs,
      headers: { 'User-Agent': 'pte-healthcheck/1.0' },
    };
    const req = http.request(options, (res) => {
      res.resume();
      resolve(res.statusCode === expectedStatus);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

for (let attempt = 1; attempt <= retries; attempt++) {
  if (attempt > 1) {
    await new Promise((r) => setTimeout(r, retryDelayMs));
  }
  const ok = await check();
  if (ok) process.exit(0);
}

process.exit(1);
