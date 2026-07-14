export interface AuthConfig {
  readonly sessionDurationMinutes: number;
  readonly bcryptRounds: number;
  readonly cookieName: string;
  readonly maxSessionsPerUser: number;
}

export function loadAuthConfig(env: Record<string, string | undefined> = process.env): AuthConfig {
  const sessionDurationMinutes = parseInt(env.SESSION_DURATION_MINUTES ?? '1440', 10);
  const bcryptRounds = parseInt(env.BCRYPT_ROUNDS ?? '10', 10);
  const maxSessionsPerUser = parseInt(env.MAX_SESSIONS_PER_USER ?? '10', 10);

  if (!Number.isInteger(sessionDurationMinutes) || sessionDurationMinutes < 1) {
    throw new Error(`Invalid SESSION_DURATION_MINUTES: ${env.SESSION_DURATION_MINUTES}`);
  }
  if (!Number.isInteger(bcryptRounds) || bcryptRounds < 4) {
    throw new Error(`Invalid BCRYPT_ROUNDS: ${env.BCRYPT_ROUNDS}`);
  }
  if (!Number.isInteger(maxSessionsPerUser) || maxSessionsPerUser < 1) {
    throw new Error(`Invalid MAX_SESSIONS_PER_USER: ${env.MAX_SESSIONS_PER_USER}`);
  }

  return {
    sessionDurationMinutes,
    bcryptRounds,
    cookieName: env.SESSION_COOKIE_NAME ?? 'pte_session',
    maxSessionsPerUser,
  };
}
