/**
 * Centralized database connection-string resolution.
 *
 * Works in two environments without changes:
 *  - Local: DATABASE_URL (pooled) + DIRECT_URL (direct) from .env
 *  - Vercel Supabase integration: POSTGRES_PRISMA_URL (pooled) +
 *    POSTGRES_URL_NON_POOLING (direct)
 *
 * It also normalizes SSL: node-postgres v8.23+ treats `sslmode=require` as
 * `verify-full`, which rejects Supabase's pooler certificate chain. Appending
 * `uselibpqcompat=true` restores standard libpq semantics (encrypt, but don't
 * verify the chain), which is what Supabase expects.
 */
function normalize(url?: string): string | undefined {
  if (!url) return url;
  if (/sslmode=/.test(url) && !/uselibpqcompat=/.test(url)) {
    url += (url.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
  }
  return url;
}

/** Pooled (PgBouncer) connection for the app at runtime. */
export const POOLED_DATABASE_URL = normalize(
  process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
);

/** Direct connection for migrations and seeding. */
export const DIRECT_DATABASE_URL = normalize(
  process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL
);
