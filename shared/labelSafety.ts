const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function sanitizeWorldLabel(raw: string | null | undefined, max = 48): string {
  const value = String(raw ?? "").replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
  const limit = Number.isFinite(max) && max > 0 ? Math.floor(max) : 48;
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(1, limit - 1))}…`;
}

export function truncateLabel(raw: string, max = 32): string {
  return sanitizeWorldLabel(raw, max);
}
