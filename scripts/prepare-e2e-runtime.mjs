import { createServer } from 'node:net';
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
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

async function main() {
  const apiPort = await getAvailablePort();
  const webPort = await getAvailablePort();

  const defs = {
    API_HOST: '127.0.0.1',
    API_PORT: String(apiPort),
    WEB_HOST: '127.0.0.1',
    WEB_PORT: String(webPort),
    E2E_API_URL: `http://127.0.0.1:${apiPort}`,
    E2E_WEB_URL: `http://127.0.0.1:${webPort}`,
    NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}`,
    WEB_ORIGIN: `http://127.0.0.1:${webPort}`,
  };

  for (const [key, value] of Object.entries(defs)) {
    console.log(`${key}=${value}`);
    exportToGitHubEnv(key, value);
  }

  const runtimeDir = resolve(process.cwd(), 'apps', 'web', '.local-runtime');
  if (!existsSync(runtimeDir)) {
    // ensure dir for later steps
    const { mkdirSync } = await import('node:fs');
    mkdirSync(runtimeDir, { recursive: true });
  }
  writeFileSync(resolve(runtimeDir, 'e2e-env.json'), JSON.stringify(defs, null, 2));

  console.log('E2E runtime configuration prepared.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
