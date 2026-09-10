import { logger } from "@/lib/logging/logger";
import { normalizeWalletError } from "@/lib/blockchain/wallet/errors";

export function normalizeError(error: unknown): { message: string; recoverable: boolean } {
  if (error instanceof Error && error.message) {
    return { message: error.message, recoverable: true };
  }
  const wallet = normalizeWalletError(error);
  return { message: wallet.message, recoverable: wallet.recoverable };
}

export function getUserFacingMessage(error: unknown): string {
  return normalizeError(error).message.replace(/chrome-extension:\/\/\S+/gi, "").trim();
}

export async function safeAsync<T>(work: () => Promise<T>, fallback: T, context = "async"): Promise<T> {
  try {
    return await work();
  } catch (error) {
    logger.warn(context, { error: getUserFacingMessage(error) });
    return fallback;
  }
}
