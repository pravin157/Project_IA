import { NextResponse } from 'next/server';
import pool, { initDb } from '@/utils/db';
import { hashPassword } from '@/utils/auth';

export async function POST(request: Request) {
  try {
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

    // Initialize database (creates users table if not exists)
    await initDb();

    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1', [cleanEmail]);
    if (userCheck.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Hash password asynchronously
    const hashedPassword = await hashPassword(cleanPassword);

    // Insert user
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [cleanName, cleanEmail, hashedPassword]
    );

    const response = NextResponse.json({ success: true, message: 'User registered successfully' });

    // Set auth cookie
    response.cookies.set('auth_session', 'true', {
      path: '/',
      maxAge: 86400 * 7, // 7 days
      httpOnly: false,
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Signup error:', msg);
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 });
  }
}