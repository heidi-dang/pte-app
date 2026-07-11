import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import meRoute from './me.js';
import profileRoute from './profile.js';
import onboardingTargetsRoute from './onboarding/targets.js';
import onboardingMicrophoneCheckRoute from './onboarding/microphone-check.js';
import onboardingStepRoute from './onboarding/step.js';

export const appRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(meRoute);
  await fastify.register(profileRoute);
  await fastify.register(onboardingTargetsRoute);
  await fastify.register(onboardingMicrophoneCheckRoute);
  await fastify.register(onboardingStepRoute);
};

export default appRoutes;
