import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Proxy — protects:
 *   - /dashboard/*   → redirects to /login if unauthenticated
 *   - /api/admin/*   → returns 401 JSON if unauthenticated
 *
 * Verifies the `access_token` cookie using jose (Edge-compatible).
 * On success, attaches decoded user info to request headers for downstream use.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  // ── Helper: verify the JWT ──────────────────────────────
  const verifyToken = async (token: string) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
        {
          algorithms: ['HS256'],
          issuer: 'project-ia',
          audience: 'project-ia-api',
        }
      );
      return payload;
    } catch {
      return null;
    }
  };

  // ── Determine if this path needs protection ─────────────
  const isProtectedPage = pathname.startsWith('/dashboard');
  const isProtectedApi = pathname.startsWith('/api/admin');

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // ── No token at all ─────────────────────────────────────
  if (!accessToken) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Page route → redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ── Verify the access token ─────────────────────────────
  const payload = await verifyToken(accessToken);

  if (!payload) {
    // Token invalid or expired
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    // Page route → redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ── Attach user info to request headers for downstream use ─
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(payload.sub || ''));
  requestHeaders.set('x-user-role', String((payload as Record<string, unknown>).role || ''));
  requestHeaders.set('x-user-email', String((payload as Record<string, unknown>).email || ''));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
