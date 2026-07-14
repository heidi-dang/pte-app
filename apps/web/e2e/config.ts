export interface E2EConfig {
  webUrl: string;
  apiUrl: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  sessionCookieName: string;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Required E2E config variable not set: ${name}`);
  return v;
}

export function loadE2EConfig(): E2EConfig {
  return {
    webUrl: env('E2E_WEB_URL'),
    apiUrl: env('E2E_API_URL'),
    dbHost: env('E2E_DATABASE_HOST'),
    dbPort: parseInt(env('E2E_DATABASE_PORT'), 10),
    dbName: env('E2E_DATABASE_NAME'),
    dbUser: env('E2E_DATABASE_USER'),
    dbPassword: env('E2E_DATABASE_PASSWORD'),
    sessionCookieName: env('SESSION_COOKIE_NAME'),
  };
}
