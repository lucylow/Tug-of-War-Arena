import { getWalletManager } from "@/lib/blockchain/wallet/manager";
import { readPersistedWalletSession, clearPersistedWalletSession } from "@/lib/blockchain/wallet/storage";
import { isSupportedChainId } from "@/lib/web3/config";
import { normalizeProviderError } from "./providerErrors";
import type { WalletAdapterState } from "./adapters/types";

function fromBlockchain(): WalletAdapterState {
  const manager = getWalletManager();
  const session = manager.getSession();
  const status = manager.getStatus();
  const kind = session?.provider === "mobile" ? "mobile" : session?.provider === "metamask" ? "browser" : "demo";
  let mapped: WalletAdapterState["status"] = "disconnected";
  if (status === "connected" && session?.isDemo) mapped = "demo";
  else if (status === "connected") mapped = "connected";
  else if (status === "wrong-network") mapped = "wrong_network";
  else if (status === "unavailable") mapped = "unavailable";
  else if (session?.isDemo) mapped = "demo";
  return {
    kind,
    status: mapped,
    address: session?.address ?? null,
    chainId: session?.chainId ?? null,
    connectedAt: session?.connectedAt ?? null,
  };
}

/**
 * Friendzone-facing wallet manager. Provider access stays behind
 * BrowserWalletAdapter / MobileWalletAdapter / DemoWalletAdapter.
 */
export class WalletConnectManager {
  async initialize(): Promise<WalletAdapterState> {
    await getWalletManager().detect();
    const persisted = await readPersistedWalletSession();
    if (!persisted) return fromBlockchain();
    if (persisted.chainId != null && !isSupportedChainId(sessionChain(persisted.chainId))) {
      await getWalletManager().detect();
    }
    return fromBlockchain();
  }

  async detect(): Promise<boolean> {
    const status = await getWalletManager().detect();
    return status === "available" || status === "connected" || status === "wrong-network";
  }

  async connect(): Promise<WalletAdapterState> {
    try {
      await getWalletManager().connect({ mode: "auto" });
      return fromBlockchain();
    } catch (error) {
      if (normalizeProviderError(error) === "USER_REJECTED") {
        return { ...fromBlockchain(), status: "disconnected" };
      }
      await getWalletManager().connectDemo();
      return fromBlockchain();
    }
  }

  async disconnect(): Promise<WalletAdapterState> {
    await getWalletManager().disconnect();
    return fromBlockchain();
  }

  getState(): WalletAdapterState {
    return fromBlockchain();
  }

  async hydrate(): Promise<WalletAdapterState> {
    const session = await readPersistedWalletSession();
    if (!session) {
      await clearPersistedWalletSession();
      return fromBlockchain();
    }
    return this.initialize();
  }
}

function sessionChain(chainId: number | null): number | null {
  return chainId;
}

let manager: WalletConnectManager | null = null;

export function getWalletConnectManager(): WalletConnectManager {
  if (!manager) manager = new WalletConnectManager();
  return manager;
}

export function resetWalletConnectManager(): void {
  manager = null;
}
