/**
 * Returns today's date as YYYY-MM-DD in local time.
 */
export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
}

/**
 * Converts a Date to YYYY-MM-DD using local time.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Adds `days` calendar days to a YYYY-MM-DD string, returns YYYY-MM-DD.
 */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/**
 * Formats a YYYY-MM-DD date for display, e.g. "June 3, 2026".
 */
export function formatDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a YYYY-MM-DD date for display, e.g. "Jun 3".
 */
export function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Formats an ISO timestamp for display, e.g. "10:42 AM".
 */
export function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Returns the log_date for a given day_number (1-based) and start_date.
 */
export function logDateForDay(startDate: string, dayNumber: number): string {
  return addDays(startDate, dayNumber - 1);
}

/**
 * Returns the 1-based calendar sequence number for a given log_date relative to
 * start_date. Inverse of logDateForDay. Does not represent a completed turn count.
 */
export function dayNumberForDate(startDate: string, logDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ly, lm, ld] = logDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const log = new Date(ly, lm - 1, ld);
  const diffMs = log.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}
