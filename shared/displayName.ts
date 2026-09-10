const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function normalizeDisplayName(raw: string | null | undefined): string {
  const trimmed = String(raw ?? "").replace(CONTROL_CHARS, "").trim();
  if (trimmed.length < 2) return "Player";
  return trimmed.slice(0, 20);
}

export function isValidDisplayName(raw: string | null | undefined): boolean {
  const value = String(raw ?? "").replace(CONTROL_CHARS, "").trim();
  return value.length >= 2 && value.length <= 20;
}
