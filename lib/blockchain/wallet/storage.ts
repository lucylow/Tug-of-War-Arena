import { WALLET_SESSION_STORAGE_KEY, type WalletSession } from "./types";

type StorageLike = {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
};

let memoryStore: Record<string, string> = {};

const memoryStorage: StorageLike = {
  getItem(key) {
    return memoryStore[key] ?? null;
  },
  setItem(key, value) {
    memoryStore[key] = value;
  },
  removeItem(key) {
    delete memoryStore[key];
  },
};

async function resolveStorage(): Promise<StorageLike> {
  try {
    const module = await import("@react-native-async-storage/async-storage");
    return module.default as StorageLike;
  } catch {
    return memoryStorage;
  }
}

const SENSITIVE = /privateKey|mnemonic|seed|secret|credential/i;
const SESSION_MAX_AGE_MS = 30 * 60_000;

function isSession(value: unknown): value is WalletSession {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (SENSITIVE.test(key)) return false;
  }
  if (typeof record.address !== "string" || !/^0x[a-fA-F0-9]{40}$/i.test(record.address)) return false;
  if (typeof record.connectedAt !== "number" || !Number.isFinite(record.connectedAt)) return false;
  if (Date.now() - record.connectedAt > SESSION_MAX_AGE_MS) return false;
  return (
    (record.provider === "metamask" || record.provider === "mobile" || record.provider === "demo") &&
    typeof record.isDemo === "boolean"
  );
}

export function publicSessionMetadata(session: WalletSession): WalletSession {
  return {
    provider: session.provider,
    address: session.address,
    chainId: session.chainId,
    connectedAt: session.connectedAt,
    isDemo: session.isDemo,
  };
}

export async function persistWalletSession(session: WalletSession): Promise<void> {
  try {
    const storage = await resolveStorage();
    await storage.setItem(WALLET_SESSION_STORAGE_KEY, JSON.stringify(publicSessionMetadata(session)));
  } catch {
    // In-memory session still works if persistence fails.
  }
}

export async function readPersistedWalletSession(): Promise<WalletSession | null> {
  try {
    const storage = await resolveStorage();
    const raw = await storage.getItem(WALLET_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearPersistedWalletSession(): Promise<void> {
  try {
    const storage = await resolveStorage();
    await storage.removeItem(WALLET_SESSION_STORAGE_KEY);
  } catch {
    // Local disconnect still proceeds.
  }
}

export function resetWalletStorageForTests(): void {
  memoryStore = {};
}
