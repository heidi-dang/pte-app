import type { FastifyInstance } from 'fastify';
import { reportingRoutes } from './routes.js';

export async function reportingPlugin(app: FastifyInstance): Promise<void> {
  await app.register(reportingRoutes, { prefix: '/api/reporting' });
}
