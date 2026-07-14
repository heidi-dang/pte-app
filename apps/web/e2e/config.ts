export interface E2EConfig {
  webUrl: string;
  apiUrl: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  sessionCookieName: string;
  cookieDomain: string;
  cookiePath: string;
  cookieSecure: boolean;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Required E2E config variable not set: ${name}`);
  return v;
}

export function loadE2EConfig(): E2EConfig {
  const webUrlRaw = env('E2E_WEB_URL');
  const apiUrlRaw = env('E2E_API_URL');
  const dbPortRaw = env('E2E_DATABASE_PORT');

  let webUrl: URL;
  try {
    webUrl = new URL(webUrlRaw);
  } catch {
    throw new Error(`E2E_WEB_URL is not a valid absolute URL: ${webUrlRaw}`);
  }

  try {
    new URL(apiUrlRaw);
  } catch {
    throw new Error(`E2E_API_URL is not a valid absolute URL: ${apiUrlRaw}`);
  }

  const dbPort = parseInt(dbPortRaw, 10);
  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error(`E2E_DATABASE_PORT must be an integer between 1 and 65535: ${dbPortRaw}`);
  }

  const cookieDomain = webUrl.hostname;
  if (!cookieDomain) {
    throw new Error(`Could not derive cookie domain from E2E_WEB_URL: ${webUrlRaw}`);
  }

  return {
    webUrl: webUrlRaw,
    apiUrl: apiUrlRaw,
    dbHost: env('E2E_DATABASE_HOST'),
    dbPort,
    dbName: env('E2E_DATABASE_NAME'),
    dbUser: env('E2E_DATABASE_USER'),
    dbPassword: env('E2E_DATABASE_PASSWORD'),
    sessionCookieName: env('SESSION_COOKIE_NAME'),
    cookieDomain,
    cookiePath: '/',
    cookieSecure: webUrl.protocol === 'https:',
  };
}
