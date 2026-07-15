import { createServer } from 'node:net';
import { appendFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function getAvailablePort() {
  return new Promise((ok, fail) => {
    const srv = createServer();
    srv.once('error', fail);
    srv.listen(0, '127.0.0.1', () => {
      const a = srv.address();
      const port = a && typeof a === 'object' ? a.port : 0;
      srv.close(() => ok(port));
    });
  });
}

function exportToGitHubEnv(key, value) {
  const githubEnv = process.env.GITHUB_ENV;
  if (githubEnv && existsSync(githubEnv)) {
    appendFileSync(githubEnv, `${key}=${value}\n`);
  }
}

function loadDotEnv(path) {
  if (!existsSync(path)) return {};
  const env = {};
  const content = readFileSync(path, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function updateEnvLocal(envPath, updates) {
  let content = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(content)) {
      content = content.replace(re, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  if (!existsSync(resolve(envPath, '..'))) mkdirSync(resolve(envPath, '..'), { recursive: true });
  writeFileSync(envPath, content);
}

function writeE2EEnvFile(path, defs) {
  const dir = resolve(path, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const lines = [];
  for (const [key, value] of Object.entries(defs)) {
    lines.push(`${key}=${value}`);
  }
  writeFileSync(path, lines.join('\n') + '\n');
}

function getRequiredEnv(name) {
  const val = process.env[name];
  if (!val) {
    const dotEnv = loadDotEnv(resolve(process.cwd(), '.env.local'));
    const dotVal = dotEnv[name];
    if (!dotVal) throw new Error(`Missing required environment variable: ${name}`);
    return dotVal;
  }
  return val;
}

async function main() {
  const apiPort = await getAvailablePort();
  const webPort = await getAvailablePort();

  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const webUrl = `http://127.0.0.1:${webPort}`;

  const pgHost = getRequiredEnv('POSTGRES_HOST');
  const pgPort = getRequiredEnv('POSTGRES_PORT');
  const pgDatabase = getRequiredEnv('POSTGRES_DATABASE');
  const pgUser = getRequiredEnv('POSTGRES_USER');
  const pgPassword = getRequiredEnv('POSTGRES_PASSWORD');
  const sessionCookieName = getRequiredEnv('SESSION_COOKIE_NAME');

  const testDbName = `${pgDatabase}_test`;

  const defs = {
    API_HOST: '127.0.0.1',
    API_PORT: String(apiPort),
    WEB_HOST: '127.0.0.1',
    WEB_PORT: String(webPort),
    E2E_API_URL: apiUrl,
    E2E_WEB_URL: webUrl,
    NEXT_PUBLIC_API_URL: apiUrl,
    WEB_ORIGIN: webUrl,
    E2E_DATABASE_HOST: pgHost,
    E2E_DATABASE_PORT: pgPort,
    E2E_DATABASE_NAME: testDbName,
    E2E_DATABASE_USER: pgUser,
    E2E_DATABASE_PASSWORD: pgPassword,
    SESSION_COOKIE_NAME: sessionCookieName,
  };

  // Print (mask password)
  for (const [key, value] of Object.entries(defs)) {
    if (key.includes('PASSWORD')) {
      console.log(`${key}=***`);
    } else {
      console.log(`${key}=${value}`);
    }
    exportToGitHubEnv(key, value);
  }

  // Update .env.local
  updateEnvLocal(resolve(process.cwd(), '.env.local'), defs);

  // Write diagnostic JSON (without password)
  const { E2E_DATABASE_PASSWORD, ...safeDefs } = defs;
  const runtimeDir = resolve(process.cwd(), 'apps', 'web', '.local-runtime');
  if (!existsSync(runtimeDir)) mkdirSync(runtimeDir, { recursive: true });
  writeFileSync(resolve(runtimeDir, 'e2e-env.json'), JSON.stringify(safeDefs, null, 2));

  // Write shell-sourceable env file (with password for local use)
  writeE2EEnvFile(resolve(runtimeDir, 'e2e.env'), defs);

  console.log('E2E runtime configuration prepared.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
