import type { DatabaseConnection } from '../client.js';
import type { UserRecord } from '../config.js';

export interface CreateUserInput {
  readonly email: string;
  readonly passwordHash: string;
  readonly disabled?: boolean;
}

export interface UpdateUserInput {
  readonly email?: string;
  readonly passwordHash?: string;
  readonly disabled?: boolean;
}

export async function createUser(connection: DatabaseConnection, input: CreateUserInput): Promise<UserRecord> {
  const result = await connection.pool.query<UserRecord>(
    `INSERT INTO users (email, password_hash, disabled)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash as "passwordHash", disabled, version, created_at as "createdAt", updated_at as "updatedAt"`,
    [input.email, input.passwordHash, input.disabled ?? false],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create user');
  return row;
}

export async function getUserById(connection: DatabaseConnection, id: string): Promise<UserRecord | undefined> {
  const result = await connection.pool.query<UserRecord>(
    `SELECT id, email, password_hash as "passwordHash", disabled, version, created_at as "createdAt", updated_at as "updatedAt"
     FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0];
}

export async function getUserByEmail(connection: DatabaseConnection, email: string): Promise<UserRecord | undefined> {
  const result = await connection.pool.query<UserRecord>(
    `SELECT id, email, password_hash as "passwordHash", disabled, version, created_at as "createdAt", updated_at as "updatedAt"
     FROM users WHERE email = $1`,
    [email],
  );
  return result.rows[0];
}

export async function updateUser(
  connection: DatabaseConnection,
  id: string,
  input: UpdateUserInput,
): Promise<UserRecord | undefined> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.email !== undefined) {
    sets.push(`email = $${index++}`);
    values.push(input.email);
  }
  if (input.passwordHash !== undefined) {
    sets.push(`password_hash = $${index++}`);
    values.push(input.passwordHash);
  }
  if (input.disabled !== undefined) {
    sets.push(`disabled = $${index++}`);
    values.push(input.disabled);
  }

  if (sets.length === 0) return getUserById(connection, id);

  sets.push(`version = version + 1`);
  sets.push(`updated_at = NOW()`);
  values.push(id);

  const result = await connection.pool.query<UserRecord>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${index}
     RETURNING id, email, password_hash as "passwordHash", disabled, version, created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0];
}

export async function deleteUser(connection: DatabaseConnection, id: string): Promise<boolean> {
  const result = await connection.pool.query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function addUserRole(connection: DatabaseConnection, userId: string, role: string): Promise<void> {
  await connection.pool.query(
    `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
     ON CONFLICT (user_id, role) DO NOTHING`,
    [userId, role],
  );
}

export async function removeUserRole(connection: DatabaseConnection, userId: string, role: string): Promise<void> {
  await connection.pool.query('DELETE FROM user_roles WHERE user_id = $1 AND role = $2', [userId, role]);
}

export async function getUserRoles(connection: DatabaseConnection, userId: string): Promise<string[]> {
  const result = await connection.pool.query<{ role: string }>('SELECT role FROM user_roles WHERE user_id = $1', [
    userId,
  ]);
  return result.rows.map((r) => r.role);
}
