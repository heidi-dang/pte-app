import { z } from 'zod';

/**
 * Zod schema for the application environment configuration.
 * Validates .env.local / environment variables at startup.
 */

const logLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);
const nodeEnvSchema = z.enum(['development', 'test', 'staging', 'production']);

export const environmentSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  APP_VERSION: z.string().min(1),
  LOG_LEVEL: logLevelSchema.default('info'),

  WEB_HOST: z.string().default('0.0.0.0'),
  WEB_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),

  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  SCORING_HOST: z.string().default('0.0.0.0'),
  SCORING_PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  POSTGRES_HOST: z.string().default('127.0.0.1'),
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  POSTGRES_DATABASE: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string(),

  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

  LOCAL_STARTUP_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  LOCAL_SMOKE_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),

  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_SCORING_URL: z.string().url().default('http://localhost:5000'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('0.0.0'),
});

export type ParsedEnvironment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: Record<string, string | undefined>): ParsedEnvironment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Environment validation failed:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
  }
  return result.data;
}
