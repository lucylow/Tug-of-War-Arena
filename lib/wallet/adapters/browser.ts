import { connectLiveSession, disconnectLiveSession } from "@/lib/web3/client";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import { getInjectedProvider } from "@/lib/web3/detect";
import { parseChainId } from "@/lib/web3/format";
import type { WalletAdapter, WalletAdapterState } from "./types";

function idle(): WalletAdapterState {
  return { kind: "browser", status: "disconnected", address: null, chainId: null, connectedAt: null };
}

export function createBrowserWalletAdapter(): WalletAdapter {
  let state = idle();
  return {
    kind: "browser",
    async detect() {
      return Boolean(getInjectedProvider());
    },
    async connect() {
      const live = await connectLiveSession();
      const address = live.accounts[0] ?? null;
      state = {
        kind: "browser",
        status: address ? "connected" : "disconnected",
        address,
        chainId: parseChainId(live.chainId) ?? DEFAULT_CHAIN_ID,
        connectedAt: Date.now(),
      };
      return state;
    },
    async disconnect() {
      await disconnectLiveSession();
      state = idle();
    },
    getState() {
      return state;
    },
  };
}
