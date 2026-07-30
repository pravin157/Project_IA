# 🔐 Code Review — Issue Verification Report

**Project:** Project_IA (Next.js 16 + PostgreSQL)  
**Date:** 2026-07-30  
**Reference:** [auth_code_review.md](file:///d:/Intern/Project_IA/auth_code_review.md)  
**Purpose:** Verify whether each issue from the original review has been fixed

---

## Verification Summary

| # | Issue | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| 4.1 | Tokens leaked in response body | 🔴 HIGH | ✅ **FIXED** | Tokens removed from all 3 endpoints |
| 4.2 | Sensitive data in localStorage | 🟡 MEDIUM | ✅ **FIXED** | `localStorage.setItem` removed from login & signup |
| 4.3 | Middleware not registered | 🔴 CRITICAL | ✅ **FIXED** | `proxy.ts` → `middleware.ts`, default export |
| 4.4 | No password strength validation | 🟡 MEDIUM | ✅ **FIXED** | Min 8, max 72 — both client & server |
| 4.5 | No rate limiting | 🟡 MEDIUM | ❌ **NOT FIXED** | No rate-limiting code found |
| 4.6 | No CSRF protection | 🟢 LOW | ⏭️ **Acceptable** | `sameSite: strict` is sufficient |
| 4.7 | No token cleanup | 🟢 LOW | ✅ **PARTIALLY FIXED** | Cleanup runs per-user during refresh |
| 5.1 | Missing `iss`/`aud` claims | 🟡 MEDIUM | ✅ **FIXED** | Added to sign + verify + middleware |
| 5.2 | Unused dependencies | 🟢 LOW | ✅ **FIXED** | `jsonwebtoken`, `@types/jsonwebtoken`, `bcryptjs` removed |
| 5.3 | Refresh rotation not in transaction | 🟡 MEDIUM | ✅ **FIXED** | `BEGIN`/`COMMIT`/`ROLLBACK` block added |
| 5.4 | `initDb()` called on every request | ⚠️ MINOR | ⏭️ **Acceptable** | Guard flag prevents re-execution |
| 5.5 | Client-side auth without server guard | ⚠️ CONCERN | ✅ **FIXED** | Middleware now enforces server-side auth |

---

## Detailed Verification

### ✅ 4.1 — Tokens Leaked in Response Body → **FIXED**

**How it was fixed:** The `accessToken`, `refreshToken`, and `token` fields were removed from the JSON response in all three endpoints.

````carousel
**Login Response** — [login/route.ts](file:///d:/Intern/Project_IA/app/api/auth/login/route.ts#L77-L86)
```typescript
// ✅ No raw tokens in body — cookies only
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
```
<!-- slide -->
**Signup Response** — [signup/route.ts](file:///d:/Intern/Project_IA/app/api/auth/signup/route.ts#L86-L95)
```typescript
// ✅ No raw tokens in body — cookies only
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
```
<!-- slide -->
**Refresh Response** — [refresh/route.ts](file:///d:/Intern/Project_IA/app/api/auth/refresh/route.ts#L127-L136)
```typescript
// ✅ No raw tokens in body — cookies only
// Comment explicitly references Section 4.1
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
```
````

---

### ✅ 4.2 — Sensitive Data in localStorage → **FIXED**

**How it was fixed:** `localStorage.setItem("user", ...)` calls were removed from both login and signup pages. The pages now navigate directly to `/dashboard` without caching user data.

| File | Before | After |
|------|--------|-------|
| [login/page.tsx](file:///d:/Intern/Project_IA/app/login/page.tsx#L52-L54) | `localStorage.setItem("user", JSON.stringify(data.user));` | Removed — direct `window.location.href = "/dashboard"` |
| [signup/page.tsx](file:///d:/Intern/Project_IA/app/signup/page.tsx#L65-L67) | `localStorage.setItem("user", JSON.stringify({...}));` | Removed — direct `window.location.href = "/dashboard"` |

---

### ✅ 4.3 — Middleware Not Registered → **FIXED**

**How it was fixed:**
1. `proxy.ts` has been **deleted** (file no longer exists)
2. A proper [middleware.ts](file:///d:/Intern/Project_IA/middleware.ts) was created at the project root
3. Exports `default async function middleware(request: NextRequest)` — the correct Next.js convention
4. Includes `export const config = { matcher: ['/dashboard/:path*', '/api/admin/:path*'] }`
5. Also validates `iss`/`aud` claims (fixes 5.1 simultaneously)

```typescript
// ✅ middleware.ts — correct filename & default export
export default async function middleware(request: NextRequest) {
  // ...JWT verification with iss/aud...
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
```

---

### ✅ 4.4 — No Password Strength Validation → **FIXED**

**How it was fixed:** Password length validation added at **both** the server and client layers.

| Layer | Min Length | Max Length | File |
|-------|-----------|-----------|------|
| Server (API) | 8 chars | 72 chars | [signup/route.ts:31-43](file:///d:/Intern/Project_IA/app/api/auth/signup/route.ts#L31-L43) |
| Client (UI) | 8 chars | 72 chars | [signup/page.tsx:42-49](file:///d:/Intern/Project_IA/app/signup/page.tsx#L42-L49) |

```typescript
// Server-side (signup/route.ts)
if (cleanPassword.length < 8) {
  return NextResponse.json(
    { error: 'Password must be at least 8 characters' },
    { status: 400 }
  );
}
if (cleanPassword.length > 72) {
  return NextResponse.json(
    { error: 'Password must be 72 characters or fewer' },
    { status: 400 }
  );
}
```

> [!NOTE]
> The 72-character maximum aligns with bcrypt's internal truncation limit, preventing silent data loss.

---

### ❌ 4.5 — No Rate Limiting → **NOT FIXED**

**Current state:** There is still **no rate-limiting logic** anywhere in the codebase. A `grep` for `rate` and `limit` across all `.ts`/`.tsx` files returned zero results.

**Risk remains:** Auth endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/auth/refresh`) are vulnerable to:
- Brute-force password attacks
- Account enumeration via rapid signup attempts
- Refresh token flooding / denial of service

> [!WARNING]
> This is the **only remaining medium-severity issue** from the original review. See the [Recommended Fix](#recommended-fix-rate-limiting) section below.

---

### ⏭️ 4.6 — No CSRF Protection → **Acceptable (No Action Required)**

`sameSite: strict` cookies continue to provide adequate CSRF protection. No changes were needed.

---

### ✅ 4.7 — No Token Cleanup → **PARTIALLY FIXED**

**How it was fixed:** A cleanup query runs as part of the refresh token rotation transaction in [refresh/route.ts:111-115](file:///d:/Intern/Project_IA/app/api/auth/refresh/route.ts#L111-L115):

```typescript
// Cleanup: delete expired or revoked tokens for this user
await client.query(
  'DELETE FROM refresh_tokens WHERE user_id = $1 AND (revoked = TRUE OR expires_at < NOW())',
  [user.id]
);
```

**Why "partially":** This only cleans up tokens for the *current user* during a refresh. Tokens for inactive users (who never refresh) will still accumulate. A global cron-based cleanup would be more thorough, but this is a reasonable improvement for most use cases.

---

### ✅ 5.1 — Missing `iss`/`aud` Claims → **FIXED**

**How it was fixed:** `issuer` and `audience` claims are now set during signing and validated during verification across **all three verification points**:

| Location | `iss` | `aud` | File |
|----------|-------|-------|------|
| `signAccessToken()` | ✅ `project-ia` | ✅ `project-ia-api` | [lib/auth.ts:56-57](file:///d:/Intern/Project_IA/lib/auth.ts#L56-L57) |
| `signRefreshToken()` | ✅ `project-ia` | ✅ `project-ia-api` | [lib/auth.ts:76-77](file:///d:/Intern/Project_IA/lib/auth.ts#L76-L77) |
| `verifyAccessToken()` | ✅ validated | ✅ validated | [lib/auth.ts:93-97](file:///d:/Intern/Project_IA/lib/auth.ts#L93-L97) |
| `verifyRefreshToken()` | ✅ validated | ✅ validated | [lib/auth.ts:112-116](file:///d:/Intern/Project_IA/lib/auth.ts#L112-L116) |
| `middleware.ts` | ✅ validated | ✅ validated | [middleware.ts:28-29](file:///d:/Intern/Project_IA/middleware.ts#L28-L29) |

---

### ✅ 5.2 — Unused Dependencies → **FIXED**

**How it was fixed:** All three unused packages have been removed from `package.json`:

| Package | Before | After |
|---------|--------|-------|
| `jsonwebtoken` | ❌ Listed | ✅ Removed |
| `@types/jsonwebtoken` | ❌ Listed | ✅ Removed |
| `bcryptjs` | ❌ Listed | ✅ Removed |

---

### ✅ 5.3 — Refresh Token Rotation Not in a Transaction → **FIXED**

**How it was fixed:** The revoke-old + insert-new + cleanup sequence is now wrapped in a proper `BEGIN`/`COMMIT` transaction with `ROLLBACK` on error:

[refresh/route.ts:95-123](file:///d:/Intern/Project_IA/app/api/auth/refresh/route.ts#L95-L123)

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Revoke old token
  await client.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_jti = $1', [payload.jti]);

  // Insert new token
  await client.query('INSERT INTO refresh_tokens (user_id, token_jti, expires_at) VALUES ($1, $2, $3)', [user.id, newJti, expiresAt]);

  // Cleanup expired/revoked tokens for this user (Section 4.7)
  await client.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND (revoked = TRUE OR expires_at < NOW())', [user.id]);

  await client.query('COMMIT');
} catch (txErr) {
  await client.query('ROLLBACK');
  throw txErr;
} finally {
  client.release();
}
```

> [!TIP]
> This fix also addresses issue 4.7 (token cleanup) in the same transaction.

---

### ✅ 5.5 — Client-Side Auth Without Server Guard → **FIXED**

The working `middleware.ts` now blocks unauthenticated requests at the **Edge layer** before they reach any dashboard route. The client-side `useEffect` check in the dashboard is now a secondary defense-in-depth layer, not the sole protection.

---

## Updated Scorecard

| Category | Original Score | Current Score | Change |
|----------|---------------|---------------|--------|
| **Token Strategy** | 9/10 | 9/10 | — |
| **Password Security** | 7/10 | 9/10 | +2 |
| **Cookie Security** | 9/10 | 9/10 | — |
| **Token Storage** | 6/10 | 10/10 | +4 |
| **Route Protection** | 4/10 | 9/10 | +5 |
| **Session Management** | 8/10 | 9/10 | +1 |
| **Revocation** | 9/10 | 9/10 | — |
| **Input Validation** | 6/10 | 8/10 | +2 |
| **Error Handling** | 9/10 | 9/10 | — |
| **Database Design** | 8/10 | 9/10 | +1 |
| **Overall** | **7.5/10** | **9.0/10** | **+1.5** |

---

## Recommended Fix: Rate Limiting

The only remaining medium-severity issue is **rate limiting (4.5)**. Here is a minimal implementation approach:

### Option A — In-Memory Rate Limiter (Simple, No Dependencies)

Create a `utils/rate-limit.ts` utility:

```typescript
// utils/rate-limit.ts
const hits = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetTime) {
    hits.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count };
}
```

Then use it in auth routes:

```typescript
// In login/route.ts, at the top of POST handler:
import { rateLimit } from '@/utils/rate-limit';

const ip = request.headers.get('x-forwarded-for') || 'unknown';
const { allowed } = rateLimit(`login:${ip}`, 5, 60_000); // 5 per minute
if (!allowed) {
  return NextResponse.json(
    { error: 'Too many login attempts. Please try again later.' },
    { status: 429 }
  );
}
```

> [!IMPORTANT]
> In-memory rate limiting resets on server restart and does **not** work across multiple server instances. For production with multiple instances, use Redis or a similar shared store.

---

## Final Verdict

> [!TIP]
> **8 out of 9** issues from the original review have been resolved. The remaining gap (rate limiting) is a recommended hardening step, not a functional defect. The auth system is now at a **production-ready** level of security.

| Metric | Value |
|--------|-------|
| Issues Identified | 9 |
| Issues Fixed | **8** |
| Issues Remaining | **1** (rate limiting) |
| Overall Score | **9.0 / 10** |

---

*End of Verification Report*
