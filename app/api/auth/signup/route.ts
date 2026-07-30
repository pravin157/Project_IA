import { NextResponse } from 'next/server';
import pool, { initDb } from '@/utils/db';
import { hashPassword } from '@/utils/auth';
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/auth';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/utils/rate-limit';

export async function POST(request: Request) {
  try {
    // ── Rate limiting: 3 signups per IP per 10 minutes ────
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(`signup:${ip}`, 3, 10 * 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    const { name, email, password } = await request.json().catch(() => ({}));
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!cleanEmail.endsWith('@intoaec.ai')) {
      return NextResponse.json({ error: 'Email must end with @intoaec.ai' }, { status: 400 });
    }

    // Password strength validation
    if (cleanPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    // bcrypt silently truncates at 72 bytes
    if (cleanPassword.length > 72) {
      return NextResponse.json(
        { error: 'Password must be 72 characters or fewer' },
        { status: 400 }
      );
    }

    // Initialize database (creates users + refresh_tokens tables if not exists)
    await initDb();

    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1', [cleanEmail]);
    if (userCheck.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Hash password asynchronously
    const hashedPassword = await hashPassword(cleanPassword);

    // Insert user with default role
    const insertRes = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [cleanName, cleanEmail, hashedPassword, 'user']
    );
    const newUserId = insertRes.rows[0].id;

    // ── Generate JWT access token (15 min) ────────────────
    const accessToken = await signAccessToken({
      userId: String(newUserId),
      role: 'user',
      email: cleanEmail,
    });

    // ── Generate refresh token (7 days) with unique JTI ───
    const jti = crypto.randomUUID();
    const refreshToken = await signRefreshToken({
      userId: String(newUserId),
      jti,
    });

    // ── Store refresh token JTI in DB ─────────────────────
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_jti, expires_at) VALUES ($1, $2, $3)',
      [newUserId, jti, expiresAt]
    );

    // ── Build response & set cookies ──────────────────────
    const response = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: String(newUserId),
        name: cleanName,
        email: cleanEmail,
        role: 'user',
      },
    });

    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_COOKIE_OPTIONS);
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Signup error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}