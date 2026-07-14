'use server';

import { cookies } from 'next/headers';

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

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error('NEXT_PUBLIC_API_URL is not configured');
  return url.replace(/\/+$/, '');
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(process.env.SESSION_COOKIE_NAME || 'pte_session');
  const headers = new Headers(options.headers);
  if (sessionCookie?.value) {
    headers.set('authorization', `Bearer ${sessionCookie.value}`);
  }
  headers.set('content-type', 'application/json');
  return fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export async function registerAccount(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('displayName') as string;
  try {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || `Registration failed (${res.status})` };
    }
    const cookieStore = await cookies();
    cookieStore.set(process.env.SESSION_COOKIE_NAME || 'pte_session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user: data.user, token: data.token };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function loginAccount(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.message || `Login failed (${res.status})` };
    }
    const cookieStore = await cookies();
    cookieStore.set(process.env.SESSION_COOKIE_NAME || 'pte_session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user: data.user, token: data.token };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await apiFetch('/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user as User;
  } catch {
    return null;
  }
}

export async function logoutAccount(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Best-effort logout
  }
  const cookieStore = await cookies();
  cookieStore.delete(process.env.SESSION_COOKIE_NAME || 'pte_session');
}
