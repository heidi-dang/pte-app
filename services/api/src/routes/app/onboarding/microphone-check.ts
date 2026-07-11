import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const onboardingMicrophoneCheckRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/onboarding/microphone-check', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    try {
      await fastify.repositories.users.recordMicrophoneCheck(userId);
      reply.status(200).send({ message: 'Microphone check recorded successfully' });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to record microphone check' });
    }
  });
};
export default onboardingMicrophoneCheckRoute;
