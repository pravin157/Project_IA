import { NextResponse } from 'next/server';
import pool, { initDb } from '@/server/database/pool';
import { verifyPassword, hashPassword } from '@/server/auth/password';
import {
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

export async function POST(request: Request) {
  try {
    // ── Rate limiting: 5 attempts per IP per minute ────────
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(`login:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in a minute.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    const { email, password } = await request.json().catch(() => ({}));
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!cleanEmail.endsWith('@intoaec.ai')) {
      return NextResponse.json({ error: 'Email must end with @intoaec.ai' }, { status: 400 });
    }

    // Initialize database
    await initDb();

    // Query user with trimmed and case-insensitive email match
    const res = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE LOWER(TRIM(email)) = $1',
      [cleanEmail]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = res.rows[0];

    // Verify password against stored bcrypt hash or legacy string
    const isValid = await verifyPassword(cleanPassword, user.password.trim());
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Upgrade legacy plain-text password to bcrypt hash in DB
    if (!/^\$2[aby]\$/.test(user.password.trim())) {
      const newHash = await hashPassword(cleanPassword);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, user.id]).catch(() => { });
    }

    // ── Generate JWT access token (15 min) ────────────────
    const accessToken = await signAccessToken({
      userId: String(user.id),
      role: user.role || 'user',
      email: cleanEmail,
    });

    // ── Generate refresh token (7 days) with unique JTI ───
    const jti = crypto.randomUUID();
    const refreshToken = await signRefreshToken({
      userId: String(user.id),
      jti,
    });

    // ── Store refresh token JTI in DB for revocation ──────
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_jti, expires_at) VALUES ($1, $2, $3)',
      [user.id, jti, expiresAt]
    );

    // ── Build response & set cookies ──────────────────────
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: String(user.id),
        name: user.name,
        email: cleanEmail,
        role: user.role || 'user',
      },
    });

    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_COOKIE_OPTIONS);
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Login error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
