import fp from 'fastify-plugin';
import {
  prisma,
  PrismaClient,
  createUsersRepository,
  createSessionsRepository,
  createAuditRepository,
} from '@pte-app/db';

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient;
    repositories: {
      users: ReturnType<typeof createUsersRepository>;
      sessions: ReturnType<typeof createSessionsRepository>;
      audit: ReturnType<typeof createAuditRepository>;
    };
  }
}

export default fp(async (fastify) => {
  // Attach Prisma Client singleton
  fastify.decorate('db', prisma);

  // Attach Repositories
  fastify.decorate('repositories', {
    users: createUsersRepository(prisma),
    sessions: createSessionsRepository(prisma),
    audit: createAuditRepository(prisma),
  });

  // Ensure DB connection is closed on Fastify shutdown
  fastify.addHook('onClose', async (instance) => {
    if (instance.db && typeof instance.db.$disconnect === 'function') {
      instance.log.info('Disconnecting from database...');
      await instance.db.$disconnect();
    }
  });
});
