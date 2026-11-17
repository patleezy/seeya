import { createHmac } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// Server-only rate limiting.
//
// Counts live in the Supabase `rate_limits` table (see supabase/schema.sql), so
// limits hold across every serverless instance — an in-memory Map only sees the
// requests that happen to land on one instance.
//
// Privacy: raw IPs are never stored. The key is an HMAC of "action:ip" using a
// server-only secret, so the table can't be reversed into IP addresses even if
// it were read.
//
// If the DB call fails (e.g. the migration hasn't been run yet), we fall back to
// the old per-instance in-memory limiter rather than blocking requests.

interface MemoryEntry {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryEntry>();

function checkMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function hashKey(ip: string, action: string): string {
  // RATE_LIMIT_SECRET is optional; the service role key is already a server-only secret.
  const secret = process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'seeya';
  return createHmac('sha256', secret).update(`${action}:${ip}`).digest('hex');
}

let warnedFallback = false;

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** Returns true if the request is allowed, false if the limit is exceeded. */
export async function checkRateLimit(
  ip: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const key = hashKey(ip, action);
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000),
    });
    if (error || typeof data !== 'boolean') throw error ?? new Error('unexpected rate limit response');
    return data;
  } catch {
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn('[rateLimit] check_rate_limit RPC unavailable — using in-memory fallback. Run the rate_limits migration in supabase/schema.sql.');
    }
    return checkMemory(key, limit, windowMs);
  }
}
