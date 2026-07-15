import type { FastifyInstance } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import type { HandlerRegistry } from '@pte-app/domain';
import { QuestionSessionRepository } from './repository.js';
import { DefaultQuestionAccessPolicy } from './access-policy.js';
import { QuestionEngineService } from './service.js';
import { registerRoutes } from './routes.js';

export async function questionEnginePlugin(
  app: FastifyInstance,
  options: { db: DatabaseConnection; registry: HandlerRegistry },
): Promise<void> {
  const { db, registry } = options;

  const repo = new QuestionSessionRepository(db);

  // Default configuration for session modes
  const accessPolicy = new DefaultQuestionAccessPolicy({
    allowedModes: ['learning', 'review', 'timed-practice', 'section-test', 'mock'],
  });

  const service = new QuestionEngineService(db, repo, registry, accessPolicy);

  registerRoutes(app, service);
}
