import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookieName } from './lib/config';

const authRequiredPaths = [
  '/dashboard',
  '/profile',
  '/settings',
  '/sessions',
  '/student',
  '/teacher',
  '/admin',
  '/content',
  '/support',
];

const guestPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const session = request.cookies.get(getSessionCookieName())?.value;
  const pathname = request.nextUrl.pathname;

  const needsAuth = authRequiredPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (needsAuth && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (guestPaths.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
