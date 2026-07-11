import fp from 'fastify-plugin';
import { EmailProvider } from '../email/provider.js';
import { ConsoleEmailProvider } from '../email/console-provider.js';

declare module 'fastify' {
  interface FastifyInstance {
    emailProvider: EmailProvider;
  }
}

export default fp(async (fastify) => {
  const provider = new ConsoleEmailProvider();
  fastify.decorate('emailProvider', provider);
});
