export type WalletErrorCode =
  | "USER_REJECTED"
  | "NO_PROVIDER"
  | "PROVIDER_UNAVAILABLE"
  | "WRONG_NETWORK"
  | "NETWORK_NOT_ADDED"
  | "TIMEOUT"
  | "DISCONNECTED"
  | "ALREADY_PENDING"
  | "UNSUPPORTED_RUNTIME"
  | "PROVIDER_ERROR"
  | "UNKNOWN";

export interface NormalizedWalletError {
  code: WalletErrorCode;
  title: string;
  message: string;
  recoverable: boolean;
  original?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function collectRecords(error: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();
  const stack: unknown[] = [error];
  while (stack.length > 0 && out.length < 16) {
    const current = stack.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const record = current as Record<string, unknown>;
    out.push(record);
    stack.push(record.error, record.info, record.cause, record.data);
  }
  return out;
}

export function getProviderErrorCode(error: unknown): number | string | null {
  for (const record of collectRecords(error)) {
    if (typeof record.code === "number") return record.code;
    if (typeof record.code === "string" && record.code.trim()) return record.code;
  }
  return null;
}

export function readProviderErrorMessage(error: unknown): string {
  if (typeof error === "string") return sanitizeWalletMessage(error);
  const parts: string[] = [];
  for (const record of collectRecords(error)) {
    for (const key of ["shortMessage", "reason", "message"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) parts.push(value);
    }
  }
  return sanitizeWalletMessage(parts.join(" "));
}

export function sanitizeWalletMessage(message: string): string {
  return message
    .replace(/chrome-extension:\/\/[a-z0-9]+\/[^\s)]+/gi, "")
    .replace(/moz-extension:\/\/[^\s)]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isUserRejectedError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === 4001 || code === 5000 || code === "ACTION_REJECTED" || code === "USER_REJECTED") return true;
  return /user rejected|rejected the request|denied transaction|user denied|user closed|closed the (popup|modal)|connection was rejected|connection cancelled|connection canceled|wallet connection canceled/i.test(
    readProviderErrorMessage(error),
  );
}

function isPendingError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === -32002 || code === "ALREADY_PENDING") return true;
  return /already pending|request already pending|already processing/i.test(readProviderErrorMessage(error));
}

function isTimeoutError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === "TIMEOUT") return true;
  return /timed out|did not respond|taking too long/i.test(readProviderErrorMessage(error));
}

function isDisconnectedError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === 4900 || code === 4901 || code === "DISCONNECTED") return true;
  return /provider is disconnected|wallet disconnected|chain disconnected/i.test(readProviderErrorMessage(error));
}

function isNoProviderError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === "NO_PROVIDER" || code === "PROVIDER_UNAVAILABLE") return true;
  return /no provider|not available|extension not found|no ethereum provider|wallet unavailable/i.test(
    readProviderErrorMessage(error),
  );
}

function isUnsupportedRuntimeError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === "UNSUPPORTED_RUNTIME") return true;
  return /unsupported runtime|window\.ethereum is not available on native/i.test(readProviderErrorMessage(error));
}

function isWrongNetworkError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === "WRONG_NETWORK") return true;
  return /wrong network|unsupported chain|chain mismatch/i.test(readProviderErrorMessage(error));
}

function isNetworkNotAddedError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === 4902 || code === "NETWORK_NOT_ADDED") return true;
  return /unrecognized chain|wallet_addEthereumChain|network not added|added to MetaMask/i.test(
    readProviderErrorMessage(error),
  );
}

function isProviderConnectFailure(error: unknown): boolean {
  return /failed to connect to metamask|could not connect to metamask|unable to connect to metamask/i.test(
    readProviderErrorMessage(error),
  );
}

const COPY: Record<WalletErrorCode, { title: string; message: string; recoverable: boolean }> = {
  USER_REJECTED: {
    title: "Connection canceled",
    message: "Wallet connection canceled.",
    recoverable: true,
  },
  NO_PROVIDER: {
    title: "Wallet unavailable",
    message: "Wallet isn’t available in this environment. Continue in demo mode or open the web wallet experience.",
    recoverable: true,
  },
  PROVIDER_UNAVAILABLE: {
    title: "Wallet unavailable",
    message: "Wallet isn’t available in this environment. Continue in demo mode or open the web wallet experience.",
    recoverable: true,
  },
  WRONG_NETWORK: {
    title: "Wrong network",
    message: "Switch to a supported network to use blockchain features. Arena play stays available.",
    recoverable: true,
  },
  NETWORK_NOT_ADDED: {
    title: "Add network",
    message: "Add the supported network to continue.",
    recoverable: true,
  },
  TIMEOUT: {
    title: "Wallet timed out",
    message: "Wallet connection is taking too long.",
    recoverable: true,
  },
  DISCONNECTED: {
    title: "Wallet disconnected",
    message: "Wallet disconnected.",
    recoverable: true,
  },
  ALREADY_PENDING: {
    title: "Request pending",
    message: "A wallet request is already pending. Open the wallet popup to continue.",
    recoverable: true,
  },
  UNSUPPORTED_RUNTIME: {
    title: "Wallet unavailable",
    message: "Wallet isn’t available in this environment. Continue in demo mode or open the web wallet experience.",
    recoverable: true,
  },
  PROVIDER_ERROR: {
    title: "Wallet connection failed",
    message: "Wallet connection failed.",
    recoverable: true,
  },
  UNKNOWN: {
    title: "Wallet connection failed",
    message: "Wallet connection failed.",
    recoverable: true,
  },
};

export function classifyWalletErrorCode(error: unknown): WalletErrorCode {
  const record = asRecord(error);
  if (typeof record?.code === "string" && record.code in COPY) {
    return record.code as WalletErrorCode;
  }
  if (isUserRejectedError(error)) return "USER_REJECTED";
  if (isPendingError(error)) return "ALREADY_PENDING";
  if (isTimeoutError(error)) return "TIMEOUT";
  if (isDisconnectedError(error)) return "DISCONNECTED";
  if (isUnsupportedRuntimeError(error)) return "UNSUPPORTED_RUNTIME";
  if (isNetworkNotAddedError(error)) return "NETWORK_NOT_ADDED";
  if (isWrongNetworkError(error)) return "WRONG_NETWORK";
  if (isNoProviderError(error)) return "NO_PROVIDER";
  if (isProviderConnectFailure(error)) return "PROVIDER_ERROR";
  return "PROVIDER_ERROR";
}

export function normalizeWalletError(error: unknown): NormalizedWalletError {
  const code = classifyWalletErrorCode(error);
  const copy = COPY[code];
  return {
    code,
    title: copy.title,
    message: copy.message,
    recoverable: copy.recoverable,
    original: error,
  };
}

export function createWalletError(code: WalletErrorCode, message?: string): Error {
  const copy = COPY[code];
  return Object.assign(new Error(message ?? copy.message), { code, title: copy.title });
}

export function shouldOfferDemoFallback(error: unknown): boolean {
  const code = classifyWalletErrorCode(error);
  return (
    code === "NO_PROVIDER" ||
    code === "PROVIDER_UNAVAILABLE" ||
    code === "UNSUPPORTED_RUNTIME" ||
    code === "PROVIDER_ERROR" ||
    code === "TIMEOUT" ||
    code === "UNKNOWN"
  );
}

export type NormalizedWalletErrorCode = WalletErrorCode;

export const WALLET_UNAVAILABLE_MESSAGE = COPY.NO_PROVIDER.message;

export function toWalletUserMessage(error: unknown): string {
  return normalizeWalletError(error).message;
}

export function safeWalletDiagnostic(error: unknown): Record<string, unknown> {
  const normalized = normalizeWalletError(error);
  return {
    code: normalized.code,
    recoverable: normalized.recoverable,
    title: normalized.title,
  };
}

function isUnauthorizedError(error: unknown): boolean {
  const code = getProviderErrorCode(error);
  if (code === 4100) return true;
  return /unauthorized|not authorized|method not authorized|permission (denied|not granted)/i.test(
    readProviderErrorMessage(error),
  );
}

export function shouldAutoFallbackToDemo(error: unknown, hasInjectedProvider: boolean): boolean {
  if (isUserRejectedError(error) || isPendingError(error) || isUnauthorizedError(error)) return false;
  if (isTimeoutError(error) || isDisconnectedError(error)) return false;
  const code = classifyWalletErrorCode(error);
  if (code === "WRONG_NETWORK" || code === "DISCONNECTED" || code === "ALREADY_PENDING" || code === "NETWORK_NOT_ADDED") return false;
  if (code === "NO_PROVIDER" || code === "PROVIDER_UNAVAILABLE" || code === "UNSUPPORTED_RUNTIME") return true;
  if (isProviderConnectFailure(error)) return !hasInjectedProvider;
  return !hasInjectedProvider;
}
