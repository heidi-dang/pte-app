/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

interface ProfileBody {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  country?: string;
  timezone?: string;
  proficiencyLevel?: string;
  studyHistoryMonths?: number;
}

export const profileRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.patch<{ Body: ProfileBody }>('/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const { firstName, lastName, displayName, country, timezone, proficiencyLevel, studyHistoryMonths } =
      request.body || {};

    // Validate studyHistoryMonths if provided
    if (studyHistoryMonths !== undefined) {
      if (!Number.isInteger(studyHistoryMonths) || studyHistoryMonths < 0) {
        reply.status(400).send({ error: 'Bad Request', message: 'studyHistoryMonths must be a non-negative integer' });
        return;
      }
    }

    try {
      const existing = await fastify.repositories.users.findById(userId);
      if (!existing) {
        reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        return;
      }

      const profile = await fastify.repositories.users.upsertProfile({
        userId,
        firstName: firstName ?? existing.profile?.firstName ?? '',
        lastName: lastName ?? existing.profile?.lastName ?? '',
        displayName,
        country,
        timezone,
        proficiencyLevel,
        studyHistoryMonths,
      } as any);

      reply.status(200).send({ profile });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to update profile' });
    }
  });
};
export default profileRoute;
