// Parses simple duration strings like "15m", "30d", "12h", "45s" (the same
// format used by JWT_ACCESS_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN in .env) into
// a future Date. Kept dependency-free rather than pulling in `ms` for one use.
const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

export function durationFromNow(duration: string): Date {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(duration.trim());

  if (!match) {
    throw new Error(`Invalid duration string: "${duration}". Expected formats like "15m", "12h", "30d".`);
  }

  const [, amountRaw, unit] = match;
  const amount = Number(amountRaw);

  return new Date(Date.now() + amount * UNIT_TO_MS[unit]);
}
