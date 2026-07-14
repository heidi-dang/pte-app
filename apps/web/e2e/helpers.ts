const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function register(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/register`, {
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
  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) throw new Error('Failed to get user');
  const me = await meRes.json();
  const { Client } = await import('pg');
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pte_app_test',
    user: 'pte_app',
    password: 'local_dev_password_only',
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
