export type NormalizedWalletError =
  | "USER_REJECTED"
  | "ALREADY_PENDING"
  | "NETWORK_NOT_ADDED"
  | "DISCONNECTED"
  | "PROVIDER_ERROR";

function codeOf(error: unknown): number | string | null {
  if (!error || typeof error !== "object") return null;
  const record = error as { code?: unknown };
  if (typeof record.code === "number" || typeof record.code === "string") return record.code;
  return null;
}

function messageOf(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "";
}

export function normalizeProviderError(error: unknown): NormalizedWalletError {
  const code = codeOf(error);
  if (code === 4001 || code === "ACTION_REJECTED") return "USER_REJECTED";
  if (code === -32002) return "ALREADY_PENDING";
  if (code === 4902) return "NETWORK_NOT_ADDED";
  if (code === 4900 || code === 4901) return "DISCONNECTED";
  const message = messageOf(error);
  if (/user rejected|rejected the request|user denied|user closed/i.test(message)) return "USER_REJECTED";
  if (/already pending|request already pending/i.test(message)) return "ALREADY_PENDING";
  if (/unrecognized chain|wallet_addEthereumChain|network not added/i.test(message)) return "NETWORK_NOT_ADDED";
  if (/disconnected|provider is disconnected/i.test(message)) return "DISCONNECTED";
  return "PROVIDER_ERROR";
}

export function shouldRetryWalletError(kind: NormalizedWalletError): boolean {
  return kind === "PROVIDER_ERROR";
}
