import Fastify from 'fastify';
import { loadConfig } from './env.js';

const config = loadConfig();
const app = Fastify({ logger: { level: config.logLevel } });

app.get('/health/live', async () => ({
  service: 'api',
  status: 'ok',
  version: config.version,
  timestamp: new Date().toISOString(),
}));

app.get('/health/ready', async () => ({
  service: 'api',
  status: 'ok',
  ready: true,
  version: config.version,
  timestamp: new Date().toISOString(),
}));

const start = async () => {
  try {
    await app.listen({ host: config.host, port: config.port });
    app.log.info(`API service listening on ${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await app.close();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await app.close();
  process.exit(0);
});

start();
