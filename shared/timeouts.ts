export const WORLD_FEED_TIMEOUT_MS = 8_000;
export const ROOM_TIMEOUT_MS = 6_000;
export const WALLET_TIMEOUT_MS = 90_000;
export const PROOF_TIMEOUT_MS = 20_000;
export const GOVERNANCE_TIMEOUT_MS = 10_000;

export const RETRY_BACKOFF_MS = [500, 1_000, 2_000] as const;
export const RETRY_MAX_ATTEMPTS = 3;

export type RetryKind = "transport" | "user_rejected" | "invalid" | "unsupported";

export function shouldRetry(kind: RetryKind, attempt: number): boolean {
  if (kind !== "transport") return false;
  return attempt < RETRY_MAX_ATTEMPTS;
}

export function retryDelayMs(attempt: number): number {
  return RETRY_BACKOFF_MS[Math.max(0, Math.min(RETRY_BACKOFF_MS.length - 1, attempt))] ?? 2_000;
}
