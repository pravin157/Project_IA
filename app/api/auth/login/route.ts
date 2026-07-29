import { NextResponse } from 'next/server';
import pool, { initDb } from '@/utils/db';
import { verifyPassword, hashPassword } from '@/utils/auth';

export async function POST(request: Request) {
  try {
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
    const res = await pool.query('SELECT id, name, password FROM users WHERE LOWER(TRIM(email)) = $1', [cleanEmail]);
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

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        name: user.name,
        email: cleanEmail,
      }
    });

    // Set auth cookie
    response.cookies.set('auth_session', 'true', {
      path: '/',
      maxAge: 86400 * 7, // 7 days
      httpOnly: false,
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Login error:', msg);
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 });
  }
}