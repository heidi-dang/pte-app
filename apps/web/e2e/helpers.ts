import type { BrowserContext } from '@playwright/test';
import { loadE2EConfig } from './config';

const cfg = loadE2EConfig();

export function getConfig() {
  return cfg;
}

export async function setSessionCookie(context: BrowserContext, token: string): Promise<void> {
  await context.addCookies([
    {
      name: cfg.sessionCookieName,
      value: token,
      domain: cfg.cookieDomain,
      path: cfg.cookiePath,
      secure: cfg.cookieSecure,
    },
  ]);
}

export async function register(email: string, password: string): Promise<string> {
  const res = await fetch(`${cfg.apiUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: email.split('@')[0] }),
  });
  if (!res.ok) throw new Error(`Registration failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.token;
}

export async function createUserWithRole(email: string, password: string, role: string): Promise<string> {
  const token = await register(email, password);
  const meRes = await fetch(`${cfg.apiUrl}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) throw new Error('Failed to get user');
  const me = await meRes.json();
  const { Client } = await import('pg');
  const client = new Client({
    host: cfg.dbHost,
    port: cfg.dbPort,
    database: cfg.dbName,
    user: cfg.dbUser,
    password: cfg.dbPassword,
  });
  await client.connect();
  try {
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [me.user.id]);
    await client.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [me.user.id, role]);
  } finally {
    await client.end();
  }
  return token;
}
