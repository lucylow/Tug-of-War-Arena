import { getInjectedProvider } from "@/lib/web3/detect";

export type WalletErrorKind =
  | "user_rejected"
  | "pending"
  | "locked"
  | "unauthorized"
  | "disconnected"
  | "timeout"
  | "unavailable"
  | "unsupported"
  | "network"
  | "internal"
  | "unknown";

export function collectErrorRecords(error: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();
  const stack: unknown[] = [error];
  while (stack.length > 0 && out.length < 16) {
    const current = stack.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const record = current as Record<string, unknown>;
    out.push(record);
    stack.push(record.error, record.info, record.cause, record.data, record.revert);
  }
  return out;
}

export function getWalletErrorCode(error: unknown): number | null {
  for (const record of collectErrorRecords(error)) {
    if (typeof record.code === "number") return record.code;
  }
  return null;
}

function getWalletErrorStringCode(error: unknown): string | null {
  for (const record of collectErrorRecords(error)) {
    if (typeof record.code === "string" && record.code.trim()) return record.code;
  }
  return null;
}

const ARENA_ERROR_NAMES = [
  "InvalidMatch",
  "InvalidName",
  "AlreadyInMatch",
  "NotInMatch",
  "MatchNotWaiting",
  "MatchNotActive",
  "MatchFull",
  "NotAuthorized",
  "NotEnoughPlayers",
  "InvalidDelta",
  "AlreadyFinished",
  "TransferFailed",
] as const;

const ARENA_ERROR_MESSAGES: Record<(typeof ARENA_ERROR_NAMES)[number], string> = {
  InvalidMatch: "That match does not exist on this network.",
  InvalidName: "Display name must be 2–20 characters.",
  AlreadyInMatch: "This wallet is already in the lobby.",
  NotInMatch: "This wallet is not in that match.",
  MatchNotWaiting: "That lobby is no longer waiting for players.",
  MatchNotActive: "That match is not active.",
  MatchFull: "That lobby is full.",
  NotAuthorized: "This action is reserved for the match operator.",
  NotEnoughPlayers: "Need at least two players before the match can start.",
  InvalidDelta: "That pull checkpoint was rejected as out of range.",
  AlreadyFinished: "That match is already settled.",
  TransferFailed: "The FZONE transfer failed.",
};

const ARENA_ERROR_PATTERN = new RegExp(`\\b(${ARENA_ERROR_NAMES.join("|")})\\b`);

export type ContractErrorKind =
  | "user_rejected"
  | "pending"
  | "configuration"
  | "revert"
  | "connectivity"
  | "submitted"
  | "unknown";

function readErrorName(error: unknown): string | null {
  for (const record of collectErrorRecords(error)) {
    const revert = record.revert as { name?: string } | undefined;
    if (typeof revert?.name === "string" && revert.name) return revert.name;
    const data = record.data as { errorName?: string } | undefined;
    if (typeof data?.errorName === "string" && data.errorName) return data.errorName;
    const source = `${typeof record.shortMessage === "string" ? record.shortMessage : ""} ${typeof record.reason === "string" ? record.reason : ""} ${typeof record.message === "string" ? record.message : ""}`;
    const match = source.match(ARENA_ERROR_PATTERN);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function readErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  const parts: string[] = [];
  for (const record of collectErrorRecords(error)) {
    for (const key of ["shortMessage", "reason", "message"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) parts.push(value);
    }
  }
  return parts.join(" ");
}

function withCause(message: string, error: unknown): Error {
  if (error instanceof Error && error.message === message) return error;
  return Object.assign(new Error(message), { cause: error });
}

export function isUserRejected(error: unknown): boolean {
  const code = getWalletErrorCode(error);
  if (code === 4001 || code === 5000) return true;
  if (getWalletErrorStringCode(error) === "ACTION_REJECTED") return true;
  return /user rejected|rejected the request|denied transaction|user denied|user closed|closed the (popup|modal)|transaction was rejected|connection was rejected|connection cancelled|connection canceled/i.test(
    readErrorMessage(error),
  );
}

export function isPendingRequest(error: unknown): boolean {
  const code = getWalletErrorCode(error);
  if (code === -32002) return true;
  return /already pending|request already pending|already processing|resource unavailable/i.test(readErrorMessage(error));
}

export function isLockedWallet(error: unknown): boolean {
  return /wallet is locked|must be unlocked|please unlock|metamask is locked|the extension is locked/i.test(
    readErrorMessage(error),
  );
}

export function isUnauthorizedWallet(error: unknown): boolean {
  if (getWalletErrorCode(error) === 4100) return true;
  return /unauthorized|not authorized|method not authorized|permission (denied|not granted)|not been authorized/i.test(
    readErrorMessage(error),
  );
}

export function isWalletDisconnected(error: unknown): boolean {
  const code = getWalletErrorCode(error);
  if (code === 4900 || code === 4901) return true;
  return /provider is disconnected|wallet disconnected|chain disconnected|disconnected from chain/i.test(
    readErrorMessage(error),
  );
}

export function isWalletTimeout(error: unknown): boolean {
  if (getWalletErrorStringCode(error) === "TIMEOUT") return true;
  return /metamask did not respond|did not respond\. unlock|wallet request timed out|timed out waiting for (the )?wallet|close a stuck popup/i.test(
    readErrorMessage(error),
  );
}

export function isWalletUnavailable(error: unknown): boolean {
  return /metamask is not available|no wallet provider|extension not found|no ethereum provider|failed to open metamask deeplink/i.test(
    readErrorMessage(error),
  );
}

export function isUnsupportedWalletMethod(error: unknown): boolean {
  if (getWalletErrorCode(error) === 4200) return true;
  return /method not (found|supported)|unsupported method|does not exist\/is not available/i.test(readErrorMessage(error));
}

export function isFailedWalletConnect(error: unknown): boolean {
  return /failed to connect to metamask|could not connect to metamask|unable to connect to metamask/i.test(
    readErrorMessage(error),
  );
}

export function isContractRevert(error: unknown): boolean {
  if (isUserRejected(error)) return false;
  const code = getWalletErrorCode(error);
  if (code === 3) return true;
  const stringCode = getWalletErrorStringCode(error);
  if (
    stringCode === "CALL_EXCEPTION" ||
    stringCode === "UNPREDICTABLE_GAS_LIMIT" ||
    stringCode === "INSUFFICIENT_FUNDS"
  ) {
    return true;
  }
  if (readErrorName(error)) return true;
  return /execution reverted|insufficient (allowance|funds)|ERC20|transfer amount exceeds|intrinsic gas too low/i.test(
    readErrorMessage(error),
  );
}

export function isConnectivityFailure(error: unknown): boolean {
  const code = getWalletErrorCode(error);
  if (code === -32603 || code === 4902) return true;
  const stringCode = getWalletErrorStringCode(error);
  if (stringCode === "NETWORK_ERROR" || stringCode === "TIMEOUT" || stringCode === "SERVER_ERROR") return true;
  return /failed to fetch|network error|timeout|could not detect network|missing revert data|econnreset|enotfound|etimedout|503|502|429|rate limit|circuit breaker|header not found|filter not found/i.test(
    readErrorMessage(error),
  );
}

export function isConfigurationError(error: unknown): boolean {
  const message = readErrorMessage(error);
  return /not configured|wallet not connected|connect metamask to /i.test(message);
}

export function isSubmittedTransactionFailure(error: unknown): boolean {
  const stringCode = getWalletErrorStringCode(error);
  if (stringCode === "NONCE_EXPIRED" || stringCode === "REPLACEMENT_UNDERPRICED") return true;
  return /nonce too low|nonce has already been used|already known|replacement transaction underpriced|max fee per gas less than|transaction timed out|tx timeout|timed out waiting for transaction/i.test(
    readErrorMessage(error),
  );
}

export function classifyContractError(error: unknown): ContractErrorKind {
  if (isUserRejected(error)) return "user_rejected";
  if (isPendingRequest(error)) return "pending";
  if (isConfigurationError(error)) return "configuration";
  if (isSubmittedTransactionFailure(error)) return "submitted";
  if (isConnectivityFailure(error)) return "connectivity";
  if (isContractRevert(error)) return "revert";
  return "unknown";
}

export function formatContractError(error: unknown): string {
  if (isUserRejected(error)) return "Transaction was rejected in MetaMask.";
  if (isPendingRequest(error)) return "A MetaMask request is already pending. Open MetaMask to continue.";
  const named = readErrorName(error);
  if (named && named in ARENA_ERROR_MESSAGES) {
    return ARENA_ERROR_MESSAGES[named as keyof typeof ARENA_ERROR_MESSAGES];
  }
  const message = readErrorMessage(error);
  if (/insufficient allowance/i.test(message)) return "Approve FZONE before joining a staked match.";
  if (
    collectErrorRecords(error).some((record) => record.code === "INSUFFICIENT_FUNDS") ||
    /insufficient funds|exceeds balance/i.test(message)
  ) {
    return "Not enough POL to cover gas for this transaction.";
  }
  if (/transfer amount exceeds/i.test(message)) return "Not enough FZONE for the 10 FZONE entry fee.";
  if (/nonce too low|nonce has already been used|already known/i.test(message)) {
    return "That transaction was already sent. Check the lobby before retrying.";
  }
  if (/replacement transaction underpriced|max fee per gas less than/i.test(message)) {
    return "A previous transaction is still pending. Wait or speed it up in MetaMask.";
  }
  if (/invalid address|bad address checksum/i.test(message)) return "That wallet address is not valid.";
  if (/chain mismatch|wrong network|unsupported chain|network mismatch/i.test(message)) {
    return "Switch to Polygon Amoy in MetaMask, then try again.";
  }
  if (/cannot estimate gas|gas required exceeds|intrinsic gas too low/i.test(message)) {
    return "Gas estimation failed. Check your POL balance and try again.";
  }
  if (/transaction timed out|tx timeout|timed out waiting for transaction/i.test(message)) {
    return "The transaction took too long to confirm. Check the explorer, then retry if needed.";
  }
  if (/circuit breaker|429|rate limit/i.test(message)) {
    return "The RPC is busy. Wait a moment, then retry.";
  }
  if (isConnectivityFailure(error)) return "Could not reach the network. Check your connection and retry.";
  if (error instanceof Error && error.message) return error.message;
  return "On-chain request failed.";
}

export function toUserFacingError(error: unknown): Error {
  return withCause(formatContractError(error), error);
}

export function classifyWalletError(error: unknown): WalletErrorKind {
  if (isUserRejected(error)) return "user_rejected";
  if (isPendingRequest(error)) return "pending";
  if (isLockedWallet(error)) return "locked";
  if (isUnauthorizedWallet(error)) return "unauthorized";
  if (isWalletDisconnected(error)) return "disconnected";
  if (isWalletTimeout(error)) return "timeout";
  if (isWalletUnavailable(error)) return "unavailable";
  if (isUnsupportedWalletMethod(error)) return "unsupported";
  const code = getWalletErrorCode(error);
  if (code === 4902) return "network";
  if (isFailedWalletConnect(error) || code === -32603) return "internal";
  return "unknown";
}

export function formatWalletErrorTitle(error: unknown): string {
  switch (classifyWalletError(error)) {
    case "user_rejected":
      return "Connection Cancelled";
    case "pending":
      return "MetaMask Is Waiting";
    case "locked":
      return "Unlock MetaMask";
    case "unauthorized":
      return "Authorization Required";
    case "disconnected":
      return "Wallet Disconnected";
    case "timeout":
      return "MetaMask Timed Out";
    case "unavailable":
      return "MetaMask Unavailable";
    case "unsupported":
      return "Update MetaMask";
    case "network":
      return "Network Unavailable";
    default:
      return "Connection Failed";
  }
}

export function shouldFallbackToDemo(error: unknown): boolean {
  if (isUserRejected(error) || isPendingRequest(error)) return false;
  if (isLockedWallet(error) || isUnauthorizedWallet(error) || isWalletDisconnected(error) || isWalletTimeout(error)) {
    return false;
  }
  if (isUnsupportedWalletMethod(error)) return false;
  if (isFailedWalletConnect(error)) {
    try {
      return !getInjectedProvider();
    } catch {
      return true;
    }
  }
  const code = getWalletErrorCode(error);
  if (code === 4001 || code === -32002 || code === 4100 || code === 4900 || code === 4901) return false;
  if (getWalletErrorStringCode(error) === "ACTION_REJECTED") return false;
  return true;
}

export function formatWalletError(error: unknown): string {
  switch (classifyWalletError(error)) {
    case "user_rejected":
      return "Connection was rejected in MetaMask.";
    case "pending":
      return "A MetaMask request is already pending. Open the MetaMask popup to continue.";
    case "locked":
      return "MetaMask is locked. Unlock the extension, then try again.";
    case "unauthorized":
      return "MetaMask has not authorized this site. Open MetaMask, unlock it, and approve the connection.";
    case "disconnected":
      return "MetaMask disconnected. Open the extension and connect again.";
    case "timeout":
      return "MetaMask did not respond. Unlock the extension or close a stuck popup, then try again.";
    case "unavailable":
      return "MetaMask is not available on this device.";
    case "unsupported":
      return "This MetaMask version does not support that request. Update the extension and try again.";
    case "network":
      return "This network is not available in the wallet yet.";
    case "internal":
      if (isFailedWalletConnect(error)) {
        return "MetaMask could not connect. Unlock the extension, approve this site if prompted, then try again.";
      }
      return "MetaMask could not complete that request. Unlock the extension and try again.";
    default:
      break;
  }
  const message = readErrorMessage(error);
  if (/no accounts returned|accounts not found|empty accounts/i.test(message)) {
    return "No MetaMask account was returned. Unlock the extension, select an account, then try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Wallet request failed.";
}

export function getWalletErrorDetail(error: unknown): string {
  const kind = classifyWalletError(error);
  const code = getWalletErrorCode(error) ?? getWalletErrorStringCode(error);
  const message = readErrorMessage(error).trim();
  return [kind, code != null ? `code ${code}` : null, message || null].filter(Boolean).join(" · ");
}

export function toWalletError(error: unknown): Error {
  return withCause(formatWalletError(error), error);
}
