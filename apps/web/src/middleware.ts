import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard'];
const guestPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'pte_session')?.value;
  const pathname = request.nextUrl.pathname;

  if (protectedPaths.some((p) => pathname.startsWith(p)) && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (guestPaths.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
