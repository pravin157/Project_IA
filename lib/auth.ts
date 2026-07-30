import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// ──────────────────────────────────────────────
//  Token Payload Types
// ──────────────────────────────────────────────

export interface AccessTokenPayload extends JWTPayload {
  /** User primary key */
  sub: string;
  /** User role (e.g. 'admin', 'user') */
  role: string;
  /** User email */
  email: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  /** User primary key */
  sub: string;
  /** Unique token identifier for revocation */
  jti: string;
}

// ──────────────────────────────────────────────
//  Secret helpers
// ──────────────────────────────────────────────

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) throw new Error('REFRESH_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
}

// ──────────────────────────────────────────────
//  Sign Access Token  (15-min expiry)
// ──────────────────────────────────────────────

export async function signAccessToken(payload: {
  userId: string;
  role: string;
  email: string;
}): Promise<string> {
  return new SignJWT({
    sub: payload.userId,
    role: payload.role,
    email: payload.email,
  } satisfies AccessTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .setIssuer('project-ia')
    .setAudience('project-ia-api')
    .sign(getAccessSecret());
}

// ──────────────────────────────────────────────
//  Sign Refresh Token  (7-day expiry)
// ──────────────────────────────────────────────

export async function signRefreshToken(payload: {
  userId: string;
  jti: string;
}): Promise<string> {
  return new SignJWT({
    sub: payload.userId,
    jti: payload.jti,
  } satisfies RefreshTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setIssuer('project-ia')
    .setAudience('project-ia-api')
    .sign(getRefreshSecret());
}

// ──────────────────────────────────────────────
//  Verify Tokens
// ──────────────────────────────────────────────

/**
 * Verifies an access token and returns the decoded payload.
 * Returns `null` if invalid / expired.
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret(), {
      algorithms: ['HS256'],
      issuer: 'project-ia',
      audience: 'project-ia-api',
    });
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verifies a refresh token and returns the decoded payload.
 * Returns `null` if invalid / expired.
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret(), {
      algorithms: ['HS256'],
      issuer: 'project-ia',
      audience: 'project-ia-api',
    });
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
//  getSessionUser — for Server Components & Route Handlers
//  Reads the access_token cookie, verifies it, and returns user info.
// ──────────────────────────────────────────────

/**
 * Call from Server Components or Route Handlers to retrieve the
 * currently authenticated user from the access_token cookie.
 *
 * Usage:
 *   const user = await getSessionUser();
 *   if (!user) redirect('/login');
 */
export async function getSessionUser(): Promise<AccessTokenPayload | null> {
  // Dynamic import to avoid pulling next/headers into edge middleware bundle
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

// ──────────────────────────────────────────────
//  Cookie configuration constants
// ──────────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** 15 minutes in seconds */
export const ACCESS_TOKEN_MAX_AGE = 15 * 60;

/** 7 days in seconds */
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: ACCESS_TOKEN_MAX_AGE,
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_MAX_AGE,
};
