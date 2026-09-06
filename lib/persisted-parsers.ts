function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeCounter(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function parseJsonArray<T>(raw: string, isItem: (value: unknown) => value is T): T[] | null {
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) && parsed.every(isItem) ? parsed : null;
}

export type StoredStats = { wins: number; totalPulls: number; bestStreak: number };

export function parseStoredStats(raw: string): StoredStats | null {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) return null;
  if (!isNonNegativeCounter(parsed.wins) || !isNonNegativeCounter(parsed.totalPulls) || !isNonNegativeCounter(parsed.bestStreak)) return null;
  return { wins: parsed.wins, totalPulls: parsed.totalPulls, bestStreak: parsed.bestStreak };
}

export type RecentCrewRecovery = { value: string[]; warning: boolean };

function isRecentCrewEntry(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length < 32;
}

export function parseRecentCrew(raw: string): string[] | null {
  const parsed = parseJsonArray(raw, isRecentCrewEntry);
  return parsed ? Array.from(new Set(parsed)).slice(0, 4) : null;
}

export function resolveRecentCrewRecovery(status: EventHydrationStatus, value: string[] | null): RecentCrewRecovery {
  if (status === "valid" && value) return { value: Array.from(new Set(value)).slice(0, 4), warning: false };
  return { value: [], warning: status === "malformed" || status === "unavailable" };
}

export type EventHydrationStatus = "missing" | "valid" | "malformed" | "unavailable";
export type FriendzoneEventRecovery<T> = { value: T; warning: boolean };

export function resolveRsvpEventRecovery(status: EventHydrationStatus, value: "Plaza Sprint" | "Wearable Rush" | null): FriendzoneEventRecovery<"Plaza Sprint" | "Wearable Rush" | null> {
  if (status === "valid" && value) return { value, warning: false };
  return { value: null, warning: status === "malformed" || status === "unavailable" };
}

export function resolveBooleanRecovery(status: EventHydrationStatus, value: boolean | null, fallback = false): FriendzoneEventRecovery<boolean> {
  if (status === "valid" && value !== null) return { value, warning: false };
  return { value: fallback, warning: status === "malformed" || status === "unavailable" };
}

export function resolveWaitlistRecovery(status: EventHydrationStatus, value: boolean | null): FriendzoneEventRecovery<boolean> {
  return resolveBooleanRecovery(status, value);
}

export type PartyCodeHydrationStatus = "missing" | "valid" | "malformed" | "unavailable";
export type PartyCodeRecovery = { value: string; shouldPersist: boolean; warning: boolean };

export function resolvePartyCodeRecovery(status: PartyCodeHydrationStatus, value: string | null, fallback: string): PartyCodeRecovery {
  if (status === "valid" && value) return { value, shouldPersist: false, warning: false };
  if (status === "unavailable") return { value: fallback, shouldPersist: false, warning: true };
  return { value: fallback, shouldPersist: true, warning: status === "malformed" };
}
