export interface NormalizedAppError {
  code: string;
  message: string;
  recoverable: boolean;
}

const FALLBACK_MESSAGE = "Something went wrong. You can keep using the demo.";

export function normalizeError(error: unknown): NormalizedAppError {
  if (error && typeof error === "object") {
    const record = error as { code?: unknown; message?: unknown; recoverable?: unknown };
    const message = typeof record.message === "string" && record.message.trim() ? record.message : FALLBACK_MESSAGE;
    if (/chrome-extension:\/\/|inpage\.js/i.test(message)) {
      return {
        code: "PROVIDER_ERROR",
        message: "Wallet connection failed. Continue in demo mode — Web3 is optional.",
        recoverable: true,
      };
    }
    return {
      code: typeof record.code === "string" ? record.code : "UNKNOWN",
      message,
      recoverable: record.recoverable !== false,
    };
  }
  if (typeof error === "string" && error.trim()) {
    return { code: "UNKNOWN", message: error, recoverable: true };
  }
  return { code: "UNKNOWN", message: FALLBACK_MESSAGE, recoverable: true };
}

export function toUserMessage(error: unknown): string {
  return normalizeError(error).message;
}

export async function runSafely<T>(
  action: () => T | Promise<T>,
  fallback: T,
): Promise<{ ok: true; value: T } | { ok: false; value: T; error: NormalizedAppError }> {
  try {
    const value = await action();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, value: fallback, error: normalizeError(error) };
  }
}
