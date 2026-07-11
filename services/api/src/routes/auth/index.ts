import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import registerRoute from './register.js';
import loginRoute from './login.js';
import logoutRoute from './logout.js';
import verifyEmailRoute from './verify-email.js';
import forgotPasswordRoute from './forgot-password.js';
import resetPasswordRoute from './reset-password.js';

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(registerRoute);
  await fastify.register(loginRoute);
  await fastify.register(logoutRoute);
  await fastify.register(verifyEmailRoute);
  await fastify.register(forgotPasswordRoute);
  await fastify.register(resetPasswordRoute);
};

export default authRoutes;
