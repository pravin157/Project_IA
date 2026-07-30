import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import pool, { initDb } from '@/utils/db';

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's info from the
 * access_token cookie. Used by client components to check auth state
 * and fetch the user's name (which is not stored in the JWT).
 */
export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Fetch the user's name from the database — it's not in the JWT payload
    await initDb();
    const dbRes = await pool.query('SELECT name FROM users WHERE id = $1', [user.sub]);
    const name = dbRes.rows[0]?.name ?? null;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.sub,
        name,
        role: user.role,
        email: user.email,
      },
    });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
