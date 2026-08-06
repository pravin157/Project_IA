import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool, { initDb } from '@/server/database/pool';
import {
  verifyRefreshToken,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/server/auth/tokens';

/**
 * POST /api/auth/logout
 *
 * Clears both access and refresh token cookies, and
 * invalidates/deletes the refresh token record in the DB.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshTokenValue = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    // ── Invalidate refresh token in DB if present ─────────
    if (refreshTokenValue) {
      const payload = await verifyRefreshToken(refreshTokenValue);
      if (payload?.sub) {
        await initDb();
        // Revoke ALL refresh tokens for this user on logout
        await pool.query(
          'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE',
          [payload.sub]
        );
      }
    }

    // ── Clear both cookies ────────────────────────────────
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear access token cookie
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Clear refresh token cookie
    response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
      path: '/api/auth',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Also clear the legacy auth_session cookie if present
    response.cookies.set('auth_session', '', {
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Logout error:', msg);

    // Even on error, clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out',
    });
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
    response.cookies.set(REFRESH_TOKEN_COOKIE, '', { path: '/api/auth', maxAge: 0 });
    response.cookies.set('auth_session', '', { path: '/', maxAge: 0 });
    return response;
  }
}
