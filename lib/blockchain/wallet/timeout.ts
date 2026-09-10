import { FEATURES } from "@/lib/config/features";
import { logger } from "@/lib/logging/logger";

export const WALLET_CONNECT_TIMEOUT_MS = 20_000;

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = "Wallet connection is taking too long.",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(Object.assign(new Error(message), { code: "TIMEOUT" }));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function safeAsync<T>(work: () => Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return Promise.resolve(work()).catch((error) => {
      logger.warn(context, { error: error instanceof Error ? error.message : "unknown" });
      return fallback;
    });
  } catch (error) {
    logger.warn(context, { error: error instanceof Error ? error.message : "unknown" });
    return Promise.resolve(fallback);
  }
}

export function liveWritesEnabled(): boolean {
  return FEATURES.LIVE_BLOCKCHAIN_WRITES;
}
