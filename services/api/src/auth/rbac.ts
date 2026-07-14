export type UserRole = 'student' | 'teacher' | 'content_editor' | 'admin' | 'support';

export const ALL_ROLES: UserRole[] = ['student', 'teacher', 'content_editor', 'admin', 'support'];

export interface PermissionMatrix {
  readonly [role: string]: readonly string[];
}

export const DEFAULT_PERMISSIONS: PermissionMatrix = Object.freeze({
  student: Object.freeze(['dashboard:student', 'profile:read', 'profile:update', 'sessions:manage']),
  teacher: Object.freeze([
    'dashboard:teacher',
    'profile:read',
    'profile:update',
    'sessions:manage',
    'students:view',
    'reviews:view',
  ]),
  content_editor: Object.freeze([
    'dashboard:content',
    'profile:read',
    'profile:update',
    'sessions:manage',
    'content:edit',
    'content:review',
  ]),
  admin: Object.freeze([
    'dashboard:admin',
    'dashboard:student',
    'dashboard:teacher',
    'dashboard:content',
    'dashboard:support',
    'profile:read',
    'profile:update',
    'sessions:manage',
    'users:manage',
    'system:view',
    'content:publish',
    'content:retire',
  ]),
  support: Object.freeze(['dashboard:support', 'profile:read', 'profile:update', 'sessions:manage', 'users:view']),
});

export function hasPermission(
  roles: UserRole[],
  permission: string,
  matrix: PermissionMatrix = DEFAULT_PERMISSIONS,
): boolean {
  return roles.some((role) => matrix[role]?.includes(permission));
}

export function hasAnyRole(roles: UserRole[], required: UserRole[]): boolean {
  return roles.some((role) => required.includes(role));
}

export function isValidRole(role: string): role is UserRole {
  return ALL_ROLES.includes(role as UserRole);
}
