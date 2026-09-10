export const ALLOWED_REACTIONS = ["🔥", "👏", "💪", "❤️"] as const;
export type AllowedReaction = (typeof ALLOWED_REACTIONS)[number];

export function isAllowedReaction(value: string): value is AllowedReaction {
  return (ALLOWED_REACTIONS as readonly string[]).includes(value);
}

export function normalizeReaction(raw: string | null | undefined): AllowedReaction | null {
  const value = String(raw ?? "").trim();
  return isAllowedReaction(value) ? value : null;
}

export function rejectMalformedString(raw: unknown, max = 240): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length === 0 || raw.length > max) return null;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(raw)) return null;
  return raw;
}
