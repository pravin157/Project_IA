import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // Clear the auth_session cookie
  response.cookies.set('auth_session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: false,
  });
  return response;
}
