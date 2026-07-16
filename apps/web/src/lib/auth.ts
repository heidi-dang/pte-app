'use server';

import { cookies } from 'next/headers';
import { getSessionCookieName } from './config';
import { findMockUserByCredentials, setMockUserInStorage, DEFAULT_MOCK_USER } from './mock-auth';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

function getApiUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

function createMockToken(): string {
  return `mock-token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getSessionCookieName());
  const headers = new Headers(options.headers);
  if (sessionCookie?.value) {
    headers.set('authorization', `Bearer ${sessionCookie.value}`);
  }
  headers.set('content-type', 'application/json');
  try {
    return fetch(`${apiUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    return null;
  }
}

export async function registerAccount(formData: FormData): Promise<AuthResult> {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';
  const displayName = (formData.get('displayName') as string) || '';

  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });

  if (res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || `Registration failed (${res.status})` };
    }
    const cookieStore = await cookies();
    cookieStore.set(process.env.SESSION_COOKIE_NAME || getSessionCookieName(), data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user: data.user as User, token: data.token as string };
  }

  // Frontend-only mock fallback for development
  if (process.env.NODE_ENV !== 'production') {
    const existing = findMockUserByCredentials(email, password);
    if (existing) {
      return { success: false, error: 'An account with this email already exists in demo mode.' };
    }
    const user: User = {
      id: `mock-${Date.now()}`,
      email: email.toLowerCase(),
      displayName: (displayName || email.split('@')[0]) ?? null,
      roles: ['student'],
    };
    const token = createMockToken();
    const cookieStore = await cookies();
    cookieStore.set(process.env.SESSION_COOKIE_NAME || getSessionCookieName(), token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user, token };
  }
  return { success: false, error: 'Unable to connect to the server. Please try again later.' };
}

export async function loginAccount(formData: FormData): Promise<AuthResult> {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';

  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || `Login failed (${res.status})` };
    }
    const cookieStore = await cookies();
    cookieStore.set(process.env.SESSION_COOKIE_NAME || getSessionCookieName(), data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user: data.user as User, token: data.token as string };
  }

  // Frontend-only mock fallback for development
  if (process.env.NODE_ENV !== 'production') {
    const user = findMockUserByCredentials(email, password);
    if (!user) {
      return { success: false, error: 'Demo credentials are invalid. Try student@pte.app / Password123' };
    }
    const token = createMockToken();
    const cookieStore = await cookies();
    cookieStore.set(process.env.SESSION_COOKIE_NAME || getSessionCookieName(), token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user, token };
  }
  return { success: false, error: 'Unable to connect to the server. Please try again later.' };
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await apiFetch('/auth/me');
  if (res) {
    const data = await res.json().catch(() => ({}));
    return (data.user as User) || null;
  }
  // If API is unavailable in dev, return a default mock user so the UI remains navigable.
  if (process.env.NODE_ENV !== 'production') {
    return DEFAULT_MOCK_USER;
  }
  return null;
}

export async function logoutAccount(): Promise<void> {
  const res = await apiFetch('/auth/logout', { method: 'POST' });
  if (res) {
    try {
      await res.json();
    } catch {
      // ignore
    }
  }
  const cookieStore = await cookies();
  cookieStore.delete(process.env.SESSION_COOKIE_NAME || getSessionCookieName());
}

export { setMockUserInStorage };
