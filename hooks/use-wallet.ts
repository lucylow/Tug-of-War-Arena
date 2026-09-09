import { useCallback, useEffect, useState } from "react";

import { DemoModeManager } from "@/lib/mock/DemoModeManager";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import { useWallet as useMetaMaskWallet } from "@/lib/web3/MetaMaskProvider";
import { WalletService } from "@/lib/web3/WalletService";

/**
 * Simplified wallet surface for screens that only need address, chain, and connect.
 * Live sessions still flow through MetaMaskProvider.
 */
export function useWallet() {
  const session = useMetaMaskWallet();
  const [, setGeneration] = useState(0);

  useEffect(() => DemoModeManager.getInstance().subscribe(() => setGeneration((value) => value + 1)), []);

  const managerActive = DemoModeManager.getInstance().isActive();
  const isDemo = session.connectionMode === "demo" || (managerActive && session.connectionMode !== "live");

  const connect = useCallback(async () => {
    if (DemoModeManager.getInstance().isActive() && session.connectionMode !== "live") {
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
