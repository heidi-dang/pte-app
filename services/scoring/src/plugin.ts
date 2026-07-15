import type { FastifyInstance } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { ScoringService } from './service.js';
import { registerScoringRoutes } from './routes.js';

export async function scoringPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const service = new ScoringService(options.db);
  registerScoringRoutes(app, service);
}
