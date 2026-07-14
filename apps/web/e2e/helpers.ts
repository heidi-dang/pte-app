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

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

export async function createUserWithRole(email: string, password: string, role: string): Promise<string> {
  const token = await register(email, password);
  // The API always creates users with 'student' role by default
  // For role-specific tests, we inject the role via DB
  // Fetch the user ID
  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) throw new Error('Failed to get user');
  const me = await meRes.json();

  // Override roles via direct DB call (using the Docker network host)
  const pgRes = await fetch('http://localhost:5432', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: `UPDATE user_roles SET role = $1 WHERE user_id = $2` }),
  });
  // Use the database package directly - simple pg connection
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
    // Remove existing roles and add the target role
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [me.user.id]);
    await client.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [me.user.id, role]);
    // Also update the users table created_at if needed
  } finally {
    await client.end();
  }
  return token;
}
