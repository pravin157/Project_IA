import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool, { initDb } from '@/server/database/pool';
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  REFRESH_TOKEN_MAX_AGE,
} from '@/server/auth/tokens';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/server/security/rate-limit';

/**
 * POST /api/auth/refresh
 *
 * Validates the refresh token cookie, issues a new access token,
 * and rotates the refresh token (old one revoked, new one issued atomically
 * inside a DB transaction — see Section 5.3 of the security review).
 */
export async function POST(request: Request) {
  try {
    // ── Rate limiting: 20 refresh attempts per IP per minute ──
    // Higher than login — silent auto-refresh is a normal flow.
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(`refresh:${ip}`, 20, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many refresh requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    const cookieStore = await cookies();
    const refreshTokenValue = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshTokenValue) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // ── Verify the refresh token JWT ──────────────────────
    const payload = await verifyRefreshToken(refreshTokenValue);
    if (!payload || !payload.sub || !payload.jti) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    await initDb();

    // ── Check the token JTI in the database ───────────────
    const tokenRes = await pool.query(
      'SELECT id, user_id, revoked FROM refresh_tokens WHERE token_jti = $1',
      [payload.jti]
    );

    if (tokenRes.rows.length === 0 || tokenRes.rows[0].revoked) {
      // Token not found or already revoked → possible replay attack.
      // Revoke ALL tokens for this user as a safety measure (OWASP pattern).
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
        [payload.sub]
      );
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // ── Fetch user details for new access token ───────────
    const userRes = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [payload.sub]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const user = userRes.rows[0];

    // ── Generate new tokens before the transaction ────────
    const newJti = crypto.randomUUID();
    const newRefreshToken = await signRefreshToken({
      userId: String(user.id),
      jti: newJti,
    });
    const newAccessToken = await signAccessToken({
      userId: String(user.id),
      role: user.role || 'user',
      email: user.email,
    });
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000);

    // ── Rotate refresh token atomically (BEGIN/COMMIT) ────
    // Wrapping in a transaction prevents a state where the old token is
    // revoked but the new token was never inserted (Section 5.3).
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Revoke old token
      await client.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token_jti = $1',
        [payload.jti]
      );

      // Insert new token
      await client.query(
        'INSERT INTO refresh_tokens (user_id, token_jti, expires_at) VALUES ($1, $2, $3)',
        [user.id, newJti, expiresAt]
      );

      // Cleanup: delete expired or revoked tokens for this user to keep the table lean (Section 4.7)
      await client.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1 AND (revoked = TRUE OR expires_at < NOW())',
        [user.id]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // ── Build response & set cookies ──────────────────────
    // Tokens are transported via httpOnly cookies only — not in the body (Section 4.1).
    const response = NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role || 'user',
      },
    });

    response.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, ACCESS_COOKIE_OPTIONS);
    response.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Token refresh error:', msg);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
