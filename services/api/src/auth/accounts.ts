import type { DatabaseConnection } from '@pte-app/database';
import { users as usersRepo, audit as auditRepo } from '@pte-app/database';
import { hashPassword, verifyPassword } from './crypto.js';
import type { AuthConfig } from './config.js';
import type { UserRole } from './rbac.js';

export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface UserAccount {
  readonly id: string;
  readonly email: string;
  readonly roles: UserRole[];
  readonly disabled: boolean;
}

export async function registerAccount(
  db: DatabaseConnection,
  config: AuthConfig,
  input: RegisterInput,
): Promise<UserAccount> {
  const passwordHash = await hashPassword(input.password, config.bcryptRounds);
  const user = await usersRepo.createUser(db, { email: input.email, passwordHash });
  await usersRepo.addUserRole(db, user.id, 'student');

  await auditRepo.createAuditEvent(db, {
    version: '1.0.0',
    eventType: 'created',
    actorId: user.id,
    targetType: 'user',
    targetId: user.id,
    changes: { email: input.email, displayName: input.displayName },
  });

  return {
    id: user.id,
    email: user.email,
    roles: ['student'],
    disabled: user.disabled,
  };
}

export async function authenticateAccount(
  db: DatabaseConnection,
  email: string,
  password: string,
): Promise<UserAccount | null> {
  const user = await usersRepo.getUserByEmail(db, email);
  if (!user) return null;
  if (user.disabled) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;

  const roles = await usersRepo.getUserRoles(db, user.id);
  return {
    id: user.id,
    email: user.email,
    roles: roles.filter((_r): _r is UserRole => true),
    disabled: user.disabled,
  };
}

export async function getAccountById(db: DatabaseConnection, id: string): Promise<UserAccount | null> {
  const user = await usersRepo.getUserById(db, id);
  if (!user) return null;
  const roles = await usersRepo.getUserRoles(db, user.id);
  return {
    id: user.id,
    email: user.email,
    roles: roles.filter((_r): _r is UserRole => true),
    disabled: user.disabled,
  };
}

export async function disableAccount(db: DatabaseConnection, userId: string): Promise<void> {
  await usersRepo.updateUser(db, userId, { disabled: true });
}

export async function changePassword(
  db: DatabaseConnection,
  config: AuthConfig,
  userId: string,
  newPassword: string,
): Promise<void> {
  const passwordHash = await hashPassword(newPassword, config.bcryptRounds);
  await usersRepo.updateUser(db, userId, { passwordHash });
}
