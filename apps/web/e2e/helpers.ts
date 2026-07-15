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

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${cfg.apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
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
    // Verify we connected to the correct E2E test database
    const { rows } = await client.query('SELECT current_database() AS db');
    const actualDb = rows[0]?.db;
    if (actualDb !== cfg.dbName) {
      throw new Error(`Connected to wrong database: ${actualDb}, expected ${cfg.dbName}`);
    }

    // Verify user_roles table exists
    const { rows: tableCheck } = await client.query("SELECT to_regclass('public.user_roles')::text AS exists");
    if (!tableCheck[0] || tableCheck[0].exists === null) {
      throw new Error('public.user_roles table does not exist');
    }

    // Idempotent role assignment
    await client.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id, role) DO NOTHING',
      [me.user.id, role],
    );
  } finally {
    await client.end();
  }

  // Obtain a fresh login token so roles are not cached from original session
  return login(email, password);
}
