import { isSupportedChainId } from "@/lib/web3/config";
import { parseChainId } from "@/lib/web3/format";
import { getRuntimeKind, isBrowserRuntime } from "@/lib/runtime/runtime";
import { logger, walletLogContext } from "@/lib/logging/logger";

import { createWalletError, normalizeWalletError } from "./errors";
import { WalletEventBus } from "./events";
import { getBrowserEthereumProvider } from "./provider";
import { persistWalletSession } from "./storage";
import { WALLET_CONNECT_TIMEOUT_MS, withTimeout } from "./timeout";
import type { Eip1193Provider, WalletAdapter, WalletSession } from "./types";

function requestProvider(provider: Eip1193Provider, method: string, params?: unknown): Promise<unknown> {
  let pending: Promise<unknown>;
  try {
    pending = Promise.resolve(provider.request({ method, params }));
  } catch (error) {
    return Promise.reject(error);
  }
  return pending;
}

export class BrowserWalletAdapter implements WalletAdapter {
  readonly id = "metamask" as const;
  private session: WalletSession | null = null;
  private provider: Eip1193Provider | null = null;
  private readonly bus = new WalletEventBus();
  private activeConnection: Promise<WalletSession> | null = null;
  private unsub: (() => void) | null = null;

  getProvider(): Eip1193Provider | null {
    return this.provider ?? getBrowserEthereumProvider();
  }

  async isAvailable(): Promise<boolean> {
    if (!isBrowserRuntime() && getRuntimeKind() !== "server" && getRuntimeKind() !== "unknown") {
      return false;
    }
    return getBrowserEthereumProvider() !== null;
  }

  async connect(): Promise<WalletSession> {
    if (this.activeConnection) return this.activeConnection;
    this.activeConnection = this.performConnection();
    try {
      return await this.activeConnection;
    } finally {
      this.activeConnection = null;
    }
  }

  private async performConnection(): Promise<WalletSession> {
    const provider = getBrowserEthereumProvider();
    if (!provider) throw createWalletError("NO_PROVIDER");
    if (typeof provider.request !== "function") throw createWalletError("PROVIDER_UNAVAILABLE");

    const accountsRaw = await withTimeout(
      requestProvider(provider, "eth_requestAccounts"),
      WALLET_CONNECT_TIMEOUT_MS,
      "Wallet connection is taking too long.",
    );
    if (!Array.isArray(accountsRaw) || typeof accountsRaw[0] !== "string" || !accountsRaw[0]) {
      throw createWalletError("PROVIDER_ERROR", "No accounts returned. Unlock MetaMask and select an account.");
    }

    let chainId: number | null = null;
    try {
      const rawChainId = await withTimeout(
        requestProvider(provider, "eth_chainId"),
        WALLET_CONNECT_TIMEOUT_MS,
        "Wallet connection is taking too long.",
      );
      chainId = parseChainId(
        typeof rawChainId === "string" || typeof rawChainId === "number" || typeof rawChainId === "bigint"
          ? rawChainId
          : null,
      );
    } catch (error) {
      logger.warn("MetaMask chain id read failed after connect", walletLogContext({
        code: normalizeWalletError(error).code,
        runtime: getRuntimeKind(),
        provider: "metamask",
        recoverable: true,
      }));
    }

    this.provider = provider;
    this.session = {
      provider: "metamask",
      address: accountsRaw[0],
      chainId,
      connectedAt: Date.now(),
      isDemo: false,
    };
    this.bindProvider(provider);
    await persistWalletSession(this.session);
    if (chainId != null && !isSupportedChainId(chainId)) {
      this.bus.emit("chainChanged", chainId);
    }
    return this.session;
  }

  async disconnect(): Promise<void> {
    this.unsub?.();
    this.unsub = null;
    this.provider = null;
    this.session = null;
    this.bus.emit("disconnect");
  }

  async getSession(): Promise<WalletSession | null> {
    return this.session;
  }

  async getChainId(): Promise<number | null> {
    return this.session?.chainId ?? null;
  }

  async signMessage(message: string): Promise<string> {
    const provider = this.getProvider();
    const address = this.session?.address;
    if (!provider || !address) throw createWalletError("DISCONNECTED");
    const signature = await withTimeout(
      requestProvider(provider, "personal_sign", [message, address]),
      WALLET_CONNECT_TIMEOUT_MS,
    );
    if (typeof signature !== "string" || !signature) {
      throw createWalletError("PROVIDER_ERROR", "Wallet did not return a signature.");
    }
    return signature;
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

  private bindProvider(provider: Eip1193Provider): void {
    this.unsub?.();
    const onAccounts = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      if (this.session && accounts[0]) {
        this.session = { ...this.session, address: accounts[0] };
        void persistWalletSession(this.session);
      }
      if (accounts.length === 0) {
        this.session = null;
      }
      this.bus.emit("accountsChanged", accounts);
    };
    const onChain = (...args: unknown[]) => {
      const chainId = parseChainId(
        typeof args[0] === "string" || typeof args[0] === "number" || typeof args[0] === "bigint" ? args[0] : String(args[0] ?? ""),
      );
      if (chainId == null) return;
      if (this.session) {
        this.session = { ...this.session, chainId };
        void persistWalletSession(this.session);
      }
      this.bus.emit("chainChanged", chainId);
    };
    const onDisconnect = () => {
      this.session = null;
      this.bus.emit("disconnect");
    };
    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);
    provider.on?.("disconnect", onDisconnect);
    this.unsub = () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
      provider.removeListener?.("disconnect", onDisconnect);
    };
  }
}
