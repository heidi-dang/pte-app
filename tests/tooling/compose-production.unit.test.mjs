import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const COMPOSE_FILE = `${ROOT}/compose.production.yml`;
const ENV_FILE = `${ROOT}/.env.production.test`;

function getNormalizedCompose() {
  const output = execSync(`docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} config --format json 2>/dev/null`, {
    encoding: 'utf8',
    env: { ...process.env, PATH: process.env.PATH },
  });
  return JSON.parse(output);
}

let _compose = null;
function getCompose() {
  if (!_compose) _compose = getNormalizedCompose();
  return _compose;
}

describe('Compose production configuration', () => {
  it('compose file exists and produces valid config', () => {
    assert.ok(existsSync(COMPOSE_FILE), 'compose.production.yml must exist');
    assert.ok(getCompose().services, 'Compose config must have services');
  });

  it('only Caddy publishes host ports', () => {
    for (const [name, svc] of Object.entries(getCompose().services)) {
      if (name === 'caddy') {
        assert.ok(svc.ports && svc.ports.length > 0, 'Caddy must publish ports');
      } else {
        assert.ok(!svc.ports || svc.ports.length === 0, `${name} must not publish ports`);
      }
    }
  });

  it('Postgres and Redis are not on the edge network', () => {
    const edgeServices = Object.entries(getCompose().services)
      .filter(([, svc]) => svc.networks && svc.networks.edge)
      .map(([name]) => name);
    assert.ok(!edgeServices.includes('postgres'), 'postgres must not be on edge');
    assert.ok(!edgeServices.includes('redis'), 'redis must not be on edge');
  });

  it('Caddy is not on the private network', () => {
    const caddy = getCompose().services.caddy;
    assert.ok(caddy, 'caddy service must exist');
    assert.ok(!caddy.networks?.private, 'caddy must not be on private network');
  });

  it('private network is internal', () => {
    const privateNet = getCompose().networks?.private;
    assert.ok(privateNet, 'private network must exist');
    assert.ok(privateNet.internal === true, 'private network must be internal');
  });

  it('every production service has a health check', () => {
    const composeContent = readFileSync(COMPOSE_FILE, 'utf-8');
    const dockerfile = readFileSync(`${ROOT}/Dockerfile`, 'utf-8');
    for (const name of ['postgres', 'redis', 'api', 'scoring', 'web', 'worker']) {
      const compSvc = getCompose().services[name];
      assert.ok(compSvc, `${name} service must exist`);
      const inCompose = composeContent.includes(`  ${name}:\n`) && composeContent.includes('healthcheck');
      const inDockerfile = dockerfile.includes(`HEALTHCHECK`) && dockerfile.includes(`AS ${name}`);
      assert.ok(inCompose || inDockerfile, `${name} must have healthcheck in compose or Dockerfile`);
    }
  });

  it('no runtime service executes tsx', () => {
    const dockerfile = readFileSync(`${ROOT}/Dockerfile`, 'utf-8');
    const cmdLines = dockerfile.split('\n').filter((l) => l.includes('CMD') && !l.includes('HEALTHCHECK'));
    for (const line of cmdLines) {
      assert.ok(!line.includes('tsx'), `CMD must not use tsx: ${line.trim()}`);
    }
  });

  it('health commands exist in final images (Dockerfile HEALTHCHECK)', () => {
    const dockerfile = readFileSync(`${ROOT}/Dockerfile`, 'utf-8');
    const healthcheckCount = (dockerfile.match(/HEALTHCHECK/g) || []).length;
    assert.ok(healthcheckCount >= 4, `Expected 4+ HEALTHCHECK directives, got ${healthcheckCount}`);
    const cmdLines = dockerfile.split('\n').filter((l) => l.includes('healthcheck.mjs') || l.includes('check.js'));
    assert.ok(
      cmdLines.length >= 4,
      `Expected 4+ HEALTHCHECK CMD lines with healthcheck.mjs or check.js, got ${cmdLines.length}`,
    );
  });

  it('production images do not use latest as deployed release identity', () => {
    const compose = readFileSync(COMPOSE_FILE, 'utf-8');
    assert.ok(!compose.includes(':latest'), 'Compose must not reference :latest tag');
  });

  it('Caddy depends on web, api, scoring with service_started condition', () => {
    const caddy = getCompose().services.caddy;
    assert.ok(caddy, 'caddy service must exist');
    assert.ok(caddy.depends_on, 'caddy must have depends_on');
    assert.ok(caddy.depends_on.web?.condition === 'service_started', 'caddy must depend on web: service_started');
    assert.ok(caddy.depends_on.api?.condition === 'service_started', 'caddy must depend on api: service_started');
    assert.ok(
      caddy.depends_on.scoring?.condition === 'service_started',
      'caddy must depend on scoring: service_started',
    );
  });

  it('Web depends on api with service_started condition', () => {
    const web = getCompose().services.web;
    assert.ok(web, 'web service must exist');
    assert.ok(web.depends_on?.api?.condition === 'service_started', 'web must depend on api: service_started');
  });

  it('API depends on postgres and redis with service_healthy condition', () => {
    const api = getCompose().services.api;
    assert.ok(api, 'api service must exist');
    assert.ok(
      api.depends_on?.postgres?.condition === 'service_healthy',
      'api must depend on postgres: service_healthy',
    );
    assert.ok(api.depends_on?.redis?.condition === 'service_healthy', 'api must depend on redis: service_healthy');
  });

  it('Scoring depends on postgres and redis with service_healthy condition', () => {
    const scoring = getCompose().services.scoring;
    assert.ok(scoring, 'scoring service must exist');
    assert.ok(
      scoring.depends_on?.postgres?.condition === 'service_healthy',
      'scoring must depend on postgres: service_healthy',
    );
    assert.ok(
      scoring.depends_on?.redis?.condition === 'service_healthy',
      'scoring must depend on redis: service_healthy',
    );
  });

  it('Worker depends on postgres and redis with service_healthy condition', () => {
    const worker = getCompose().services.worker;
    assert.ok(worker, 'worker service must exist');
    assert.ok(
      worker.depends_on?.postgres?.condition === 'service_healthy',
      'worker must depend on postgres: service_healthy',
    );
    assert.ok(
      worker.depends_on?.redis?.condition === 'service_healthy',
      'worker must depend on redis: service_healthy',
    );
  });
});
