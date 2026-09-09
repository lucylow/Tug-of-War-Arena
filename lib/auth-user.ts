export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

function parseOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function parseStoredDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function parseStoredUser(value: unknown): User | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const openId = parseOptionalText(record.openId);
  if (!openId) return null;

  const id = typeof record.id === "number" && Number.isFinite(record.id) ? record.id : 0;
  return {
    id,
    openId,
    name: parseOptionalText(record.name),
    email: parseOptionalText(record.email),
    loginMethod: parseOptionalText(record.loginMethod),
    lastSignedIn: parseStoredDate(record.lastSignedIn) ?? new Date(),
  };
}
