import 'server-only';

/**
 * Lightweight in-process rate limiter (fixed window).
 *
 * NOTE: state lives in the instance's memory, so on a multi-instance/serverless
 * deployment each instance keeps its own counters — this is a best-effort guard
 * against bursts, not a globally-exact limit. For strict, distributed limiting
 * move this to Upstash Redis (or similar) behind the same `rateLimit()` API.
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
}

/** Best-effort client IP from standard proxy headers. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  return (
    forwarded?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

// Opportunistic cleanup so the Map can't grow unbounded over a long uptime.
if (typeof setInterval !== 'undefined') {
  const CLEANUP_MS = 10 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, CLEANUP_MS).unref?.();
}
