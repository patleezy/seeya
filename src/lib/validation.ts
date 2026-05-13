const SLOT_KEY_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidSlotKey(key: string): boolean {
  return SLOT_KEY_RE.test(key);
}

export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  ip: string,
  action: string,
  limit: number,
  windowMs: number
): boolean {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
