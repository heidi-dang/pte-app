#!/usr/bin/env node
const isCI = process.argv.includes('--ci');

async function check(url, label, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    console.log(`  ✓ [${label}] ${url}`);
    return body;
  } catch (e) {
    clearTimeout(timer);
    console.error(`  ✗ [${label}] ${url} — ${e.message}`);
    return null;
  }
}

async function main() {
  const apiPort = process.env.API_PORT || '4000';
  const scoringPort = process.env.SCORING_PORT || '5000';
  const webPort = process.env.WEB_PORT || '3000';

  let failures = 0;

  // Web
  try {
    const webRes = await fetch(`http://localhost:${webPort}`, { signal: AbortSignal.timeout(10000) });
    if (webRes.ok) console.log(`  ✓ [web] http://localhost:${webPort}`);
    else {
      console.error(`  ✗ [web] HTTP ${webRes.status}`);
      failures++;
    }
  } catch {
    console.error(`  ✗ [web] unreachable`);
    failures++;
  }

  // API live
  const apiLive = await check(`http://localhost:${apiPort}/health/live`, 'api-live');
  if (!apiLive || apiLive.status !== 'ok') failures++;

  // API ready
  const apiReady = await check(`http://localhost:${apiPort}/health/ready`, 'api-ready');
  if (!apiReady || !apiReady.ready) failures++;

  // Scoring live
  const scLive = await check(`http://localhost:${scoringPort}/health/live`, 'scoring-live');
  if (!scLive || scLive.status !== 'ok') failures++;

  // Scoring ready
  const scReady = await check(`http://localhost:${scoringPort}/health/ready`, 'scoring-ready');
  if (!scReady || !scReady.ready) failures++;

  console.log(`\n${failures === 0 ? 'All smoke tests passed.' : `${failures} check(s) failed.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
