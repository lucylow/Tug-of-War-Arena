import { getRuntimeKind, isNativeRuntime } from "@/lib/runtime/runtime";
import { logger, walletLogContext } from "@/lib/logging/logger";
import { parseChainId } from "@/lib/web3/format";

import { createWalletError } from "./errors";
import { WalletEventBus } from "./events";
import { connectWithMetaMaskConnect, disconnectMetaMaskConnect } from "./metamaskConnect";
import { persistWalletSession } from "./storage";
import type { WalletAdapter, WalletSession } from "./types";

export class MobileWalletAdapter implements WalletAdapter {
  readonly id = "mobile" as const;
  private session: WalletSession | null = null;
  private readonly bus = new WalletEventBus();
  private activeConnection: Promise<WalletSession> | null = null;

  async isAvailable(): Promise<boolean> {
    if (!isNativeRuntime()) return false;
    try {
      const { Linking } = await import("react-native");
      return await Linking.canOpenURL("metamask://");
    } catch (error) {
      logger.warn("Native MetaMask availability check failed", walletLogContext({
        code: "UNSUPPORTED_RUNTIME",
        runtime: getRuntimeKind(),
        provider: "mobile",
        recoverable: true,
      }));
      void error;
      return false;
    }
  }

  async connect(): Promise<WalletSession> {
    if (!isNativeRuntime()) {
      throw createWalletError("UNSUPPORTED_RUNTIME");
    }
    if (this.activeConnection) return this.activeConnection;
    this.activeConnection = this.performConnection();
    try {
      return await this.activeConnection;
    } finally {
      this.activeConnection = null;
    }
  }

  private async performConnection(): Promise<WalletSession> {
    const available = await this.isAvailable();
    if (!available) throw createWalletError("PROVIDER_UNAVAILABLE");
    const live = await connectWithMetaMaskConnect();
    const address = live.accounts[0];
    if (!address) throw createWalletError("PROVIDER_ERROR", "No accounts returned. Unlock MetaMask and select an account.");
    this.session = {
      provider: "mobile",
      address,
      chainId: parseChainId(live.chainId),
      connectedAt: Date.now(),
      isDemo: false,
    };
    await persistWalletSession(this.session);
    return this.session;
  }

  async disconnect(): Promise<void> {
    await disconnectMetaMaskConnect();
    this.session = null;
    this.bus.emit("disconnect");
  }

  async getSession(): Promise<WalletSession | null> {
    return this.session;
  }

  async getChainId(): Promise<number | null> {
    return this.session?.chainId ?? null;
  }

  async signMessage(_message: string): Promise<string> {
    void _message;
    throw createWalletError("UNSUPPORTED_RUNTIME", "Native message signing is unavailable in this build.");
  }

  onAccountsChanged(callback: (accounts: string[]) => void): () => void {
    return this.bus.on("accountsChanged", callback);
  }

  onChainChanged(callback: (chainId: number) => void): () => void {
    return this.bus.on("chainChanged", callback);
  }

  onDisconnect(callback: () => void): () => void {
    return this.bus.on("disconnect", callback);
  }
}
