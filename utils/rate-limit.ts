/**
 * In-memory rate limiter for auth endpoints.
 *
 * ⚠️  IMPORTANT: This store lives in the Node.js process.
 *    - State resets on server restart.
 *    - Does NOT share state across multiple server instances.
 *    - For production multi-instance deployments, replace the `hits` Map
 *      with a Redis-backed implementation.
 */

interface HitEntry {
  count: number;
  /** Unix timestamp (ms) after which the window resets */
  resetTime: number;
}

const hits = new Map<string, HitEntry>();

/**
 * Check whether a given `key` is within the allowed rate.
 *
 * @param key         Unique key, e.g. `"login:192.168.1.1"`
 * @param maxAttempts Maximum number of requests allowed per window
 * @param windowMs    Window duration in milliseconds
 * @returns `{ allowed, remaining, retryAfterMs }`
 */
export function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = hits.get(key);

  // No entry yet, or the window has expired — start fresh
  if (!entry || now > entry.resetTime) {
    hits.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  // Within window, over limit
  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetTime - now,
    };
  }

  // Within window, still under limit
  entry.count++;
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterMs: 0,
  };
}

/**
 * Extract the best available client IP from request headers.
 * Falls back to `"unknown"` if no IP can be determined.
 */
export function getClientIp(request: Request): string {
  // Standard reverse-proxy header
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  // Vercel / Cloudflare real IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}
