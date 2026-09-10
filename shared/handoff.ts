export interface WorldHandoffPayload {
  worldId: string;
  roomId: string;
  playerId: string;
  timestamp: number;
  nonce: string;
}

export function createWorldHandoff(input: Omit<WorldHandoffPayload, "timestamp" | "nonce"> & { now?: number }): WorldHandoffPayload {
  return {
    worldId: String(input.worldId),
    roomId: String(input.roomId),
    playerId: String(input.playerId),
    timestamp: input.now ?? Date.now(),
    nonce: createNonce(),
  };
}

export function parseWorldHandoff(raw: string | null | undefined): WorldHandoffPayload | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateWorldHandoff(parsed);
  } catch {
    return null;
  }
}

export function validateWorldHandoff(value: unknown): WorldHandoffPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.some((key) => /privatekey|mnemonic|seedphrase|secret/i.test(key.replace(/[_-]/g, "")))) {
    return null;
  }
  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedKeys = Object.keys(nested as Record<string, unknown>);
      if (nestedKeys.some((key) => /privatekey|mnemonic|seedphrase|secret/i.test(key.replace(/[_-]/g, "")))) {
        return null;
      }
    }
  }
  if (typeof record.worldId !== "string" || !record.worldId) return null;
  if (typeof record.roomId !== "string" || !record.roomId) return null;
  if (typeof record.playerId !== "string" || !record.playerId) return null;
  if (typeof record.timestamp !== "number" || !Number.isFinite(record.timestamp)) return null;
  if (typeof record.nonce !== "string" || record.nonce.length < 8) return null;
  if (Date.now() - record.timestamp > 15 * 60_000) return null;
  return {
    worldId: record.worldId,
    roomId: record.roomId,
    playerId: record.playerId,
    timestamp: record.timestamp,
    nonce: record.nonce,
  };
}

function createNonce(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
