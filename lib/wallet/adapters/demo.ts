import { DEMO_ACCOUNT } from "@/lib/web3/session";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import type { WalletAdapter, WalletAdapterState } from "./types";

function idle(): WalletAdapterState {
  return { kind: "demo", status: "demo", address: null, chainId: null, connectedAt: null };
}

export function createDemoWalletAdapter(): WalletAdapter {
  let state = idle();
  return {
    kind: "demo",
    async detect() {
      return true;
    },
    async connect() {
      state = {
        kind: "demo",
        status: "demo",
        address: DEMO_ACCOUNT,
        chainId: DEFAULT_CHAIN_ID,
        connectedAt: Date.now(),
      };
      return state;
    },
    async disconnect() {
      state = idle();
    },
    getState() {
      return state;
    },
  };
}
