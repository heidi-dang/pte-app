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

export function loadE2EConfig(): E2EConfig {
  const webUrl = process.env.E2E_WEB_URL;
  const apiUrl = process.env.E2E_API_URL;
  const dbHost = process.env.E2E_DATABASE_HOST;
  const dbPort = process.env.E2E_DATABASE_PORT;
  const dbName = process.env.E2E_DATABASE_NAME;
  const dbUser = process.env.E2E_DATABASE_USER;
  const dbPassword = process.env.E2E_DATABASE_PASSWORD;
  const sessionCookieName = process.env.SESSION_COOKIE_NAME;

  const missing: string[] = [];
  if (!webUrl) missing.push('E2E_WEB_URL');
  if (!apiUrl) missing.push('E2E_API_URL');
  if (!dbHost) missing.push('E2E_DATABASE_HOST');
  if (!dbPort) missing.push('E2E_DATABASE_PORT');
  if (!dbName) missing.push('E2E_DATABASE_NAME');
  if (!dbUser) missing.push('E2E_DATABASE_USER');
  if (!dbPassword) missing.push('E2E_DATABASE_PASSWORD');
  if (!sessionCookieName) missing.push('SESSION_COOKIE_NAME');

  if (missing.length > 0) {
    throw new Error(
      `Required E2E configuration variables are not set: ${missing.join(', ')}`,
    );
  }

  return {
    webUrl,
    apiUrl,
    dbHost,
    dbPort: parseInt(dbPort, 10),
    dbName,
    dbUser,
    dbPassword,
    sessionCookieName,
  };
}
