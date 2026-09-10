import type { ConnectModeRequest, ConnectionMode } from "@/lib/web3/types";

export const DEMO_ACCOUNT = "0x7A3F00000000000000000000000000000000C91D";
export const DEMO_WALLET_ACCOUNT = DEMO_ACCOUNT;
export const DEMO_WALLET_DISPLAY = "0x7A3F...C91D";
export const DEMO_IDENTITY_ADDRESS = DEMO_ACCOUNT;
/** Older demo sessions used the zero-dead address; still treated as the local captain. */
export const LEGACY_DEMO_IDENTITY_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export const DEMO_ACCOUNT_ALIASES = [DEMO_ACCOUNT, DEMO_IDENTITY_ADDRESS, LEGACY_DEMO_IDENTITY_ADDRESS] as const;

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

export function isDemoAccount(address: string | null | undefined): boolean {
  if (!address) return false;
  const value = address.toLowerCase();
  return DEMO_ACCOUNT_ALIASES.some((alias) => alias.toLowerCase() === value);
}
