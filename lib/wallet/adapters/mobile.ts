import { Platform } from "react-native";

import { connectLiveSession, disconnectLiveSession } from "@/lib/web3/client";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import { isLiveWalletAvailable } from "@/lib/web3/detect";
import { parseChainId } from "@/lib/web3/format";
import type { WalletAdapter, WalletAdapterState } from "./types";

function idle(): WalletAdapterState {
  return { kind: "mobile", status: "unavailable", address: null, chainId: null, connectedAt: null };
}

export function createMobileWalletAdapter(): WalletAdapter {
  let state = idle();
  return {
    kind: "mobile",
    async detect() {
      if (Platform.OS === "web") return false;
      return isLiveWalletAvailable();
    },
    async connect() {
      const live = await connectLiveSession();
      const address = live.accounts[0] ?? null;
      state = {
        kind: "mobile",
        status: address ? "connected" : "unavailable",
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
