export interface SafeWalletSession {
  provider: "browser" | "mobile" | "demo";
  address: string;
  chainId: number;
  connectedAt: number;
}

const SESSION_MAX_AGE_MS = 30 * 60_000;
const SENSITIVE = /privateKey|mnemonic|seed|secret|credential/i;

export function isSafeWalletSession(value: unknown): value is SafeWalletSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (SENSITIVE.test(key)) return false;
  }
  if (record.provider !== "browser" && record.provider !== "mobile" && record.provider !== "demo") return false;
  if (typeof record.address !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(record.address)) return false;
  if (typeof record.chainId !== "number" || !Number.isInteger(record.chainId)) return false;
  if (typeof record.connectedAt !== "number" || !Number.isFinite(record.connectedAt)) return false;
  return true;
}

export function isSessionFresh(session: SafeWalletSession, now = Date.now(), maxAge = SESSION_MAX_AGE_MS): boolean {
  return now - session.connectedAt <= maxAge;
}

export const WALLET_SESSION_STORAGE_KEY = "friendzone.wallet.session.v1";
