# Project_IA Session Management & JWT Workflow Documentation

This document outlines the end-to-end Session Management architecture implemented in **Project_IA**. It details how stateless JWT access tokens are combined with database-backed refresh tokens to achieve high security, edge compatibility, token rotation, automated cleanup, and rate limiting.

---

## 1. Architectural Overview

Project_IA utilizes a secure **Two-Token Architecture**:

1. **Access Token (`access_token`)**:
   - **Type**: JSON Web Token (JWT), signed with `HS256`.
   - **Lifetime**: 15 minutes (`15m`).
   - **Transport**: `httpOnly`, `secure`, `sameSite: strict` cookie.
   - **Audience**: `/dashboard/*`, `/api/admin/*`.
   - **Edge Compatible**: Verified at the edge using `jose` inside `middleware.ts`.
2. **Refresh Token (`refresh_token`)**:
   - **Type**: JSON Web Token (JWT), signed with `HS256` containing a unique UUID (`jti`).
   - **Lifetime**: 7 days (`7d`).
   - **Transport**: `httpOnly`, `secure`, `sameSite: strict` cookie, scoped strictly to the path `/api/auth`.
   - **Storage**: Tracked in the PostgreSQL `refresh_tokens` table for rotation, revocation, and replay attack prevention.

### Session Lifecycle and Routing Flow

```mermaid
graph TD
    Client["Client Browser (React / Next.js)"]
    MW["Edge Middleware (middleware.ts)"]
    DB[("PostgreSQL Database")]

    subgraph Auth Routes
        Login["POST /api/auth/login"]
        Signup["POST /api/auth/signup"]
        Refresh["POST /api/auth/refresh"]
        Logout["POST /api/auth/logout"]
    end

    Client -->|1. Submit Credentials| Login
    Client -->|2. Register Account| Signup
    
    Login -->|3. Verify & Generate Tokens| DB
    Signup -->|4. Insert & Generate Tokens| DB
    
    Login -->|5. Set httpOnly Access & Refresh Cookies| Client
    Signup -->|5. Set httpOnly Access & Refresh Cookies| Client

    Client -->|6. Request Protected Dashboard Route| MW
    MW -->|7. Verify Access Token JWT| MW
    MW -->|Valid| Dashboard["/dashboard Page"]
    MW -->|Expired / Missing| ClientRedirect["Redirect to /login"]

    Client -->|8. Request Token Rotation| Refresh
    Refresh -->|9. Atomic DB Transaction: Revoke Old, Insert New| DB
    Refresh -->|10. Set New Cookies| Client

    Client -->|11. Request Terminate Session| Logout
    Logout -->|12. Set Revoked=TRUE for all user tokens| DB
    Logout -->|13. Clear Cookies (maxAge=0)| Client
```

---

## 2. Database Schema

The sessions and users are managed via two tables in the PostgreSQL database. Schema initialization is handled automatically on application boot / connection setup.

### Users Table
Stores the user credentials and roles. Password validation uses `bcrypt` hashing.

### Refresh Tokens Table
Tracks issued refresh tokens via their unique ID (`token_jti`). Supports token rotation and immediate session revocation.

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(token_jti);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

---

## 3. Detailed Workflows

### 3.1. Sign Up Workflow
1. **Client Form Submission**: User submits their name, email (strictly ending in `@intoaec.ai`), and password.
2. **Rate Limiting**: Checks if the client IP has exceeded the limit (3 signups per 10 minutes).
3. **Validation**: Enforces fields are not empty, checks email domain, verifies password complexity (8 to 72 characters).
4. **Database Check**: Verifies email is not already in use.
5. **Password Hashing**: Hashes password asynchronously using `bcrypt` (10 rounds).
6. **Token Issuance**: Generates access token (15m) and refresh token (7d) with a UUID `jti`.
7. **Database Persistence**: Stores the refresh token `jti` and its expiration timestamp.
8. **Cookie Transport**: Sets the cookies `access_token` and `refresh_token` as HTTP-Only, secure cookies.

### 3.2. Log In Workflow
1. **Credentials Verification**: User enters their email and password.
2. **Rate Limiting**: Limits login attempts (5 attempts per minute per IP).
3. **Database Retrieval**: Retrieves the matching user from the `users` table.
4. **Bcrypt Verification**: Compares the incoming password with the stored hash.
5. **Legacy Upgrade**: If the password is stored as plain-text (legacy), hashes it and updates the DB.
6. **Token Generation**: Generates access token (15m) and refresh token (7d) with a new UUID `jti`.
7. **Database Storage**: Registers the new refresh token in `refresh_tokens`.
8. **Cookie Transport**: Dispatches `access_token` and `refresh_token` cookies.

### 3.3. Token Rotation & Refresh Workflow (Auto-Refresh)
To maintain a seamless UX, the client triggers `/api/auth/refresh` when the access token expires.
1. **Cookie Inspection**: Reads the `refresh_token` cookie.
2. **JWT Verification**: Validates the signature and expiration of the refresh token.
3. **DB Verification**:
   - Fetches the refresh token record by its `jti`.
   - If the token is not found or has `revoked = true`, **a replay attack is assumed**. As a safety precaution, **all active refresh tokens for the user are immediately revoked**.
4. **Atomic Token Rotation**:
   - Begins a SQL transaction (`BEGIN`).
   - Revokes the old token (`revoked = true`).
   - Generates a new refresh token with a new `jti` and inserts it.
   - Cleans up any expired or already-revoked tokens for that user to keep the table size small.
   - Commits the transaction (`COMMIT`).
5. **Cookie Delivery**: Updates the `access_token` and `refresh_token` cookies in the client.

### 3.4. Log Out Workflow
1. **Database Revocation**: Decodes the refresh token (if present) and marks all tokens for that user as revoked (`revoked = true`).
2. **Cookie Expiration**: Sets both `access_token` and `refresh_token` cookies to empty string with `maxAge: 0`.
3. **Client-Side Purge**: Clears browser local storage, session storage, and redirects to `/login`.

---

## 4. Complete Codebase References

Here is the full implementation code for every component of Project_IA's session management system.

### 4.1. JWT Helper Library: `lib/auth.ts`
[lib/auth.ts](file:///d:/Intern/Project_IA/lib/auth.ts)
```typescript
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// Token Payload Types
export interface AccessTokenPayload extends JWTPayload {
  sub: string;     // User primary key
  role: string;    // User role (e.g. 'admin', 'user')
  email: string;   // User email
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;     // User primary key
  jti: string;     // Unique token identifier for revocation
}

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

// Sign Access Token (15-min expiry)
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

// Sign Refresh Token (7-day expiry)
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

// Verify Access Token
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
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

// Verify Refresh Token
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
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

// Retrieve authenticated user from Server Components / API
export async function getSessionUser(): Promise<AccessTokenPayload | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

// Cookies settings constants
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
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
```

---

### 4.2. Edge Route Gatekeeper: `middleware.ts`
[middleware.ts](file:///d:/Intern/Project_IA/middleware.ts)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

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

  const isProtectedPage = pathname.startsWith('/dashboard');
  const isProtectedApi = pathname.startsWith('/api/admin');

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  if (!accessToken) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(accessToken);

  if (!payload) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Inject token attributes down to API request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(payload.sub || ''));
  requestHeaders.set('x-user-role', String((payload as Record<string, any>).role || ''));
  requestHeaders.set('x-user-email', String((payload as Record<string, any>).email || ''));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
```

---

### 4.3. Rate Limiting Utility: `utils/rate-limit.ts`
[utils/rate-limit.ts](file:///d:/Intern/Project_IA/utils/rate-limit.ts)
```typescript
interface HitEntry {
  count: number;
  resetTime: number; // Unix timestamp
}

const hits = new Map<string, HitEntry>();

export function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetTime) {
    hits.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterMs: 0,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}
```

---

### 4.4. Database Pool & Migration Guard: `utils/db.ts`
[utils/db.ts](file:///d:/Intern/Project_IA/utils/db.ts)
```typescript
import { Pool } from 'pg';

function getCleanHost(host: string | undefined): string {
  if (!host) return 'localhost';
  let clean = host.replace(/^(jdbc:)?postgresql:\/\//i, '');
  clean = clean.split('/')[0].split(':')[0];
  return clean;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: getCleanHost(process.env.DB_HOST),
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

let dbInitialized = false;

export async function initDb() {
  if (dbInitialized) return;
  
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_jti VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'refresh_tokens' AND column_name = 'token_jti'
        ) THEN
          ALTER TABLE refresh_tokens ADD COLUMN token_jti VARCHAR(255) UNIQUE;
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'refresh_tokens' AND column_name = 'revoked'
        ) THEN
          ALTER TABLE refresh_tokens ADD COLUMN revoked BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'refresh_tokens' AND column_name = 'token' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE refresh_tokens ALTER COLUMN token DROP NOT NULL;
        END IF;
      END $$;
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(token_jti);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);`);

    dbInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
```

---

### 4.5. Password Cryptography: `utils/auth.ts`
[utils/auth.ts](file:///d:/Intern/Project_IA/utils/auth.ts)
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
}
```

---

### 4.6. Client Logout Trigger: `utils/logout.ts`
[utils/logout.ts](file:///d:/Intern/Project_IA/utils/logout.ts)
```typescript
export async function performCompleteLogout() {
  try {
    // 1. Clears httpOnly cookies server-side and revokes in DB
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });

    // 2. Clear browser storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.clear();
      sessionStorage.clear();
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // 3. Force browser redirection to wipe react state
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}
```

---

### 4.7. Sign Up Handler: `app/api/auth/signup/route.ts`
[app/api/auth/signup/route.ts](file:///d:/Intern/Project_IA/app/api/auth/signup/route.ts)
```typescript
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

    if (cleanPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (cleanPassword.length > 72) {
      return NextResponse.json({ error: 'Password must be 72 characters or fewer' }, { status: 400 });
    }

    await initDb();

    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1', [cleanEmail]);
    if (userCheck.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(cleanPassword);

    const insertRes = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [cleanName, cleanEmail, hashedPassword, 'user']
    );
    const newUserId = insertRes.rows[0].id;

    const accessToken = await signAccessToken({
      userId: String(newUserId),
      role: 'user',
      email: cleanEmail,
    });

    const jti = crypto.randomUUID();
    const refreshToken = await signRefreshToken({
      userId: String(newUserId),
      jti,
    });

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_jti, expires_at) VALUES ($1, $2, $3)',
      [newUserId, jti, expiresAt]
    );

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
```

---

### 4.8. Log In Handler: `app/api/auth/login/route.ts`
[app/api/auth/login/route.ts](file:///d:/Intern/Project_IA/app/api/auth/login/route.ts)
```typescript
import { NextResponse } from 'next/server';
import pool, { initDb } from '@/utils/db';
import { verifyPassword, hashPassword } from '@/utils/auth';
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

    await initDb();

    const res = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE LOWER(TRIM(email)) = $1',
      [cleanEmail]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = res.rows[0];

    const isValid = await verifyPassword(cleanPassword, user.password.trim());
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Upgrade legacy plain-text password to bcrypt hash in DB
    if (!/^\$2[aby]\$/.test(user.password.trim())) {
      const newHash = await hashPassword(cleanPassword);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, user.id]).catch(() => { });
    }

    const accessToken = await signAccessToken({
      userId: String(user.id),
      role: user.role || 'user',
      email: cleanEmail,
    });

    const jti = crypto.randomUUID();
    const refreshToken = await signRefreshToken({
      userId: String(user.id),
      jti,
    });

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_jti, expires_at) VALUES ($1, $2, $3)',
      [user.id, jti, expiresAt]
    );

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
```

---

### 4.9. Token Rotation Handler: `app/api/auth/refresh/route.ts`
[app/api/auth/refresh/route.ts](file:///d:/Intern/Project_IA/app/api/auth/refresh/route.ts)
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool, { initDb } from '@/utils/db';
import {
  verifyRefreshToken,
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
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshTokenValue);
    if (!payload || !payload.sub || !payload.jti) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    await initDb();

    const tokenRes = await pool.query(
      'SELECT id, user_id, revoked FROM refresh_tokens WHERE token_jti = $1',
      [payload.jti]
    );

    if (tokenRes.rows.length === 0 || tokenRes.rows[0].revoked) {
      // Replay attack safeguard: revoke everything for this user
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
        [payload.sub]
      );
      return NextResponse.json({ error: 'Refresh token has been revoked' }, { status: 401 });
    }

    const userRes = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [payload.sub]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const user = userRes.rows[0];

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

      // Prune database of stale entries
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### 4.10. Session Revocation (Log Out) Handler: `app/api/auth/logout/route.ts`
[app/api/auth/logout/route.ts](file:///d:/Intern/Project_IA/app/api/auth/logout/route.ts)
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool, { initDb } from '@/utils/db';
import {
  verifyRefreshToken,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshTokenValue = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (refreshTokenValue) {
      const payload = await verifyRefreshToken(refreshTokenValue);
      if (payload?.sub) {
        await initDb();
        await pool.query(
          'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE',
          [payload.sub]
        );
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
      path: '/api/auth',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Clean legacy auth cookies if present
    response.cookies.set('auth_session', '', {
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Logout error:', msg);

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
```

---

### 4.11. Current Session Information: `app/api/auth/me/route.ts`
[app/api/auth/me/route.ts](file:///d:/Intern/Project_IA/app/api/auth/me/route.ts)
```typescript
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import pool, { initDb } from '@/utils/db';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

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
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
```
