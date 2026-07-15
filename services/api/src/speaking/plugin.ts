import type { FastifyInstance } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { SpeakingService } from './service.js';
import { registerSpeakingRoutes } from './routes.js';

export async function speakingPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const service = new SpeakingService(options.db);
  registerSpeakingRoutes(app, service);
}
