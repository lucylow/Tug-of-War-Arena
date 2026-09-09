import type { ConnectModeRequest, ConnectionMode } from "@/lib/web3/types";

export const DEMO_ACCOUNT = "0x7A3F00000000000000000000000000000000C91D";
export const DEMO_WALLET_ACCOUNT = DEMO_ACCOUNT;
export const DEMO_WALLET_DISPLAY = "0x7A3F...C91D";

export type ConnectStrategy = "injected" | "demo";

export function resolveConnectStrategy(hasInjectedProvider: boolean): ConnectStrategy {
  return hasInjectedProvider ? "injected" : "demo";
}

export function resolveWalletConnectStrategy(
  requestedMode: ConnectModeRequest,
  liveWalletAvailable: boolean,
): ConnectionMode {
  if (requestedMode === "demo") return "demo";
  if (requestedMode === "live") return "live";
  return liveWalletAvailable ? "live" : "demo";
}

export function getWalletErrorCode(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "number") {
    return error.code;
  }
  return null;
}

export function shouldFallbackToDemo(error: unknown): boolean {
  const code = getWalletErrorCode(error);
  if (code === 4001 || code === -32002) return false;
  return true;
}

export function formatWalletError(error: unknown): string {
  const code = getWalletErrorCode(error);
  if (code === 4001) return "Connection was rejected in MetaMask.";
  if (code === -32002) return "A MetaMask request is already pending.";
  if (code === 4902) return "This network is not available in the wallet yet.";
  if (error instanceof Error && error.message) return error.message;
  return "Wallet request failed.";
}

export function isDemoAccount(address: string | null | undefined): boolean {
  return Boolean(address && address.toLowerCase() === DEMO_ACCOUNT.toLowerCase());
}
