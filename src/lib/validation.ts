const SLOT_KEY_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidSlotKey(key: string): boolean {
  return SLOT_KEY_RE.test(key);
}

export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

export function isValidDate(s: string): boolean {
  return DATE_RE.test(s);
}

export function isValidTime(s: string): boolean {
  return TIME_RE.test(s);
}
