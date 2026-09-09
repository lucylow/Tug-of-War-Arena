import { useCallback } from "react";

import { useDemoModeTick } from "@/hooks/use-demo-mode";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import { useWallet as useMetaMaskWallet } from "@/lib/web3/MetaMaskProvider";
import { WalletService } from "@/lib/web3/WalletService";

/**
 * Simplified wallet surface for screens that only need address, chain, and connect.
 * Live sessions still flow through MetaMaskProvider.
 */
export function useWallet() {
  const session = useMetaMaskWallet();
  useDemoModeTick();

  const isDemo = session.connectionMode !== "live";

  const connect = useCallback(async () => {
    if (session.connectionMode === "demo") {
      await WalletService.getInstance().connectDemo(session.chainId ?? DEFAULT_CHAIN_ID);
      return session.connect({ mode: "demo" });
    }
    return session.connect();
  }, [session]);

  const disconnect = useCallback(async () => {
    await WalletService.getInstance().disconnect();
    await session.disconnect();
  }, [session]);

  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      if (session.connectionMode !== "live") {
        await WalletService.getInstance().switchNetwork(targetChainId);
      }
      await session.switchNetwork(targetChainId);
    },
    [session],
  );

  return {
    address: session.account,
    chainId: session.chainId,
    balance: session.balance ?? "0",
    isConnected: session.isConnected,
    isConnecting: session.isConnecting,
    isDemo,
    connect,
    disconnect,
    switchNetwork,
  };
}
