// FILE: /lib/rateLimit.ts
// Simple in-memory rate limiter for API routes.
// Tracks requests per key (IP, email, or composite) within a sliding window.

type Entry = { timestamps: number[] };

const store = new Map<string, Entry>();

// Cleanup stale entries every 5 minutes to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

/**
 * Check whether a request should be rate-limited.
 *
 * @param key        Unique identifier (e.g. `ip:${ip}` or `email:${email}`)
 * @param maxHits    Maximum allowed requests within the window
 * @param windowMs   Sliding window size in milliseconds
 * @returns `true` if the request is ALLOWED, `false` if rate-limited
 */
export function rateLimit(
  key: string,
  maxHits: number,
  windowMs: number
): boolean {
  cleanup(windowMs);

  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxHits) {
    return false; // rate-limited
  }

  entry.timestamps.push(now);
  return true; // allowed
}

/**
 * Convenience: check both an IP key and an email key against the same limits.
 * Returns `true` if BOTH are within limits, `false` if either is exceeded.
 */
export function rateLimitForgotPassword(ip: string, email: string): boolean {
  const MAX_HITS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  const ipOk = rateLimit(`forgot-pw:ip:${ip}`, MAX_HITS, WINDOW_MS);
  const emailOk = rateLimit(`forgot-pw:email:${email}`, MAX_HITS, WINDOW_MS);

  return ipOk && emailOk;
}
