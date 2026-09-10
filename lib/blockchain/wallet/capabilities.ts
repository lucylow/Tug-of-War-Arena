import { isSupportedChainId } from "@/lib/web3/config";

import type { WalletAdapter, WalletSession } from "./types";

export type WalletCapabilities = {
  canDetectProvider: boolean;
  canConnect: boolean;
  canSignMessage: boolean;
  canSendTransaction: boolean;
  canSwitchChain: boolean;
  supportsLiveChainWrites: boolean;
};

export function walletCapabilities(session: WalletSession | null, adapter: WalletAdapter | null): WalletCapabilities {
  const isLive = Boolean(session && !session.isDemo);
  return {
    canDetectProvider: adapter?.id !== "demo",
    canConnect: Boolean(adapter),
    canSignMessage: Boolean(session),
    canSendTransaction: isLive,
    canSwitchChain: isLive && adapter?.id !== "demo",
    supportsLiveChainWrites: isLive && isSupportedChainId(session?.chainId),
  };
}
