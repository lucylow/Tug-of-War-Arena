import { normalizeWalletError, sanitizeWalletMessage } from "@/lib/blockchain/wallet/errors";
import { logger } from "@/lib/logging/logger";

export interface NormalizedAppError {
  code: string;
  message: string;
  recoverable: boolean;
}

const FALLBACK_MESSAGE = "Something went wrong. You can keep using the demo.";
const WALLET_EXTENSION_MESSAGE = "Wallet connection failed. Continue in demo mode — Web3 is optional.";

function readRawMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

function readCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code : undefined;
}

export function normalizeError(error: unknown): NormalizedAppError {
  const raw = readRawMessage(error);
  if (/chrome-extension:\/\/|moz-extension:\/\/|inpage\.js/i.test(raw)) {
    return { code: "PROVIDER_ERROR", message: WALLET_EXTENSION_MESSAGE, recoverable: true };
  }

  const wallet = normalizeWalletError(error);
  if (wallet.code !== "UNKNOWN" && wallet.code !== "PROVIDER_ERROR") {
    return { code: wallet.code, message: wallet.message, recoverable: wallet.recoverable };
  }

  const recordCode = readCode(error);
  if (recordCode && recordCode !== "UNKNOWN" && recordCode !== "PROVIDER_ERROR") {
    const classified = normalizeWalletError({ code: recordCode, message: raw || wallet.message });
    if (classified.code !== "PROVIDER_ERROR") {
      return { code: classified.code, message: classified.message, recoverable: classified.recoverable };
    }
  }

  const sanitized = sanitizeWalletMessage(raw).replace(/chrome-extension:\/\/\S+/gi, "").replace(/moz-extension:\/\/\S+/gi, "").trim();
  if (sanitized) {
    return {
      code: recordCode ?? wallet.code,
      message: sanitized,
      recoverable: true,
    };
  }

  return {
    code: wallet.code || "UNKNOWN",
    message: wallet.message || FALLBACK_MESSAGE,
    recoverable: wallet.recoverable,
  };
}

export function getUserFacingMessage(error: unknown): string {
  return normalizeError(error).message.replace(/chrome-extension:\/\/\S+/gi, "").replace(/moz-extension:\/\/\S+/gi, "").trim() || FALLBACK_MESSAGE;
}

export function toUserMessage(error: unknown): string {
  return getUserFacingMessage(error);
}

export async function runSafely<T>(work: () => T | Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    logger.warn("Safe async failed", { error: toUserMessage(error) });
    return fallback;
  }
}

export async function safeAsync<T>(work: () => Promise<T>, fallback: T, context = "async"): Promise<T> {
  try {
    return await work();
  } catch (error) {
    logger.warn(context, { error: toUserMessage(error) });
    return fallback;
  }
}

export function runSync<T>(work: () => T, fallback: T, context = "sync"): T {
  try {
    return work();
  } catch (error) {
    logger.warn(context, { error: toUserMessage(error) });
    return fallback;
  }
}
