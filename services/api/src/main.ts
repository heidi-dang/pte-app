import { loadConfig } from './env.js';
import { buildApp } from './app.js';
import { registerRoutes } from './auth/routes.js';

const config = loadConfig();

async function main() {
  const app = await buildApp(config);
  await registerRoutes(app);
  try {
    await app.listen({ host: config.host, port: config.port });
    app.log.info(`API service listening on ${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  process.on('SIGINT', async () => {
    await app.close();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}

main();
