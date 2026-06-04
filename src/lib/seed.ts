/** Local-timezone date key, "YYYY-MM-DD". */
export function dailyKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The session seed for a given day — identical for everyone in their local date. */
export function sessionSeed(dateKey: string): string {
  return `clearmind:${dateKey}`;
}

/** Per-block seed so modules are independent but reproducible. */
export function blockSeed(dateKey: string, moduleId: string): string {
  return `clearmind:${dateKey}:${moduleId}`;
}

/** Parse a "YYYY-MM-DD" key back into a local Date at midnight. */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole-day difference (b - a) using local midnight, ignoring DST minutiae. */
export function daysBetween(aKey: string, bKey: string): number {
  const a = keyToDate(aKey).getTime();
  const b = keyToDate(bKey).getTime();
  return Math.round((b - a) / 86_400_000);
}
