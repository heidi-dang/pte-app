import { redirect } from 'next/navigation';
import { getCurrentUser } from './auth';

export type Role = 'student' | 'teacher' | 'content_editor' | 'admin' | 'support';

export const ROLE_ROUTES: Record<string, Role | Role[]> = {
  '/student': 'student',
  '/teacher': 'teacher',
  '/admin': 'admin',
  '/content': ['content_editor', 'admin'],
  '/support': ['support', 'admin'],
};

export async function requireRole(path: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(path)}`);
  }
  const allowedRoles = ROLE_ROUTES[path];
  if (!allowedRoles) return; // no special role restriction
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!user.roles.some((r) => roles.includes(r as Role))) {
    redirect('/permission-denied');
  }
}
