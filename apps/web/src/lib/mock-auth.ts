// Mock auth helpers for frontend-only demo navigation.
// These are intentionally simple and must never be used for real authentication.

import type { User } from './auth';

const MOCK_USER_KEY = 'pte_mock_user';
const MOCK_SESSION_KEY = 'pte_mock_session';

export const MOCK_USERS: Record<string, User & { password: string }> = {
  'student@pte.app': {
    id: 'mock-student-1',
    email: 'student@pte.app',
    displayName: 'Alex Johnson',
    password: 'Password123',
    roles: ['student'],
  },
  'teacher@pte.app': {
    id: 'mock-teacher-1',
    email: 'teacher@pte.app',
    displayName: 'Dr. Sarah Chen',
    password: 'Password123',
    roles: ['teacher'],
  },
  'admin@pte.app': {
    id: 'mock-admin-1',
    email: 'admin@pte.app',
    displayName: 'Michael Ross',
    password: 'Password123',
    roles: ['admin'],
  },
  'content@pte.app': {
    id: 'mock-content-1',
    email: 'content@pte.app',
    displayName: 'Priya Nair',
    password: 'Password123',
    roles: ['content_editor'],
  },
  'support@pte.app': {
    id: 'mock-support-1',
    email: 'support@pte.app',
    displayName: 'Support Bot',
    password: 'Password123',
    roles: ['support'],
  },
};

export const DEFAULT_MOCK_USER: User = {
  id: 'mock-guest',
  email: 'guest@pte.app',
  displayName: 'Guest User',
  roles: ['student'],
};

export function getMockUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setMockUserInStorage(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    localStorage.setItem(MOCK_SESSION_KEY, `mock-session-${Date.now()}`);
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
    localStorage.removeItem(MOCK_SESSION_KEY);
  }
}

export function findMockUserByCredentials(email: string, password: string): User | null {
  const found = MOCK_USERS[email.toLowerCase()];
  if (found && found.password === password) {
  const user = Object.fromEntries(
    Object.entries(found).filter(([key]) => key !== 'password'),
  ) as unknown as User;
  return user;
  }
  return null;
}

export function isMockSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(MOCK_SESSION_KEY);
}
