const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function fromNow(timestamp: string, now: number = Date.now()): string {
  const then = Date.parse(timestamp);
  if (!Number.isFinite(then)) return "";
  const delta = now - then;
  if (delta < 45_000) return "just now";
  if (delta < HOUR) return `${Math.max(1, Math.round(delta / MINUTE))}m ago`;
  if (delta < DAY) return `${Math.max(1, Math.round(delta / HOUR))}h ago`;
  if (delta < 7 * DAY) return `${Math.max(1, Math.round(delta / DAY))}d ago`;
  return new Date(then).toLocaleDateString();
}

export function errorMessage(error: unknown, fallback = "Request failed"): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
