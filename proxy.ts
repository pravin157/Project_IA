import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const authSession = request.cookies.get('auth_session');

  // Protect /dashboard and all subroutes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!authSession || authSession.value !== 'true') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
