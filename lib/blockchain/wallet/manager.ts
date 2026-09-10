import { FEATURES } from "@/lib/config/features";
import { logger, walletLogContext } from "@/lib/logging/logger";
import { getRuntimeKind, isBrowserRuntime, isNativeRuntime } from "@/lib/runtime/runtime";
import { isSupportedChainId } from "@/lib/web3/config";

import { BrowserWalletAdapter } from "./browserAdapter";
import { DemoWalletAdapter } from "./demoAdapter";
import {
  createWalletError,
  normalizeWalletError,
  shouldAutoFallbackToDemo,
  type NormalizedWalletError,
} from "./errors";
import { MobileWalletAdapter } from "./mobileAdapter";
import { clearPersistedWalletSession, persistWalletSession } from "./storage";
import type { WalletAdapter, WalletConnectOptions, WalletSession, WalletStatus } from "./types";

export class WalletManager {
  private static instance: WalletManager | null = null;

  private readonly browser = new BrowserWalletAdapter();
  private readonly mobile = new MobileWalletAdapter();
  private readonly demo = new DemoWalletAdapter();
  private active: WalletAdapter | null = null;
  private session: WalletSession | null = null;
  private status: WalletStatus = "idle";
  private error: NormalizedWalletError | null = null;
  private activeConnection: Promise<WalletSession> | null = null;
  private readonly listeners = new Set<() => void>();
  private unsubscribers: Array<() => void> = [];

  static getInstance(): WalletManager {
    if (!WalletManager.instance) WalletManager.instance = new WalletManager();
    return WalletManager.instance;
  }

  static resetForTests(): void {
    WalletManager.instance = null;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getStatus(): WalletStatus {
    return this.status;
  }

  getSession(): WalletSession | null {
    return this.session;
  }

  getError(): NormalizedWalletError | null {
    return this.error;
  }

  getAdapter(): WalletAdapter | null {
    return this.active;
  }

  getBrowserAdapter(): BrowserWalletAdapter {
    return this.browser;
  }

  async detect(): Promise<WalletStatus> {
    this.setStatus("detecting");
    if (!FEATURES.ENABLE_WALLET) {
      this.setStatus("unavailable");
      return this.status;
    }
    if (await this.browser.isAvailable()) {
      this.setStatus("available");
      return this.status;
    }
    if (await this.mobile.isAvailable()) {
      this.setStatus("available");
      return this.status;
    }
    this.setStatus("unavailable");
    return this.status;
  }

  async connect(options: WalletConnectOptions = {}): Promise<WalletSession> {
    const requested = options.mode ?? "auto";
    if (requested === "demo") {
      return this.connectDemo();
    }
    if (this.activeConnection) return this.activeConnection;
    this.activeConnection = this.performConnect(requested);
    try {
      return await this.activeConnection;
    } finally {
      this.activeConnection = null;
    }
  }

  async connectDemo(): Promise<WalletSession> {
    this.setStatus("connecting");
    this.error = null;
    const session = await this.demo.connect();
    this.bindAdapter(this.demo);
    this.session = session;
    this.setStatus("connected");
    await persistWalletSession(session);
    return session;
  }

  async disconnect(): Promise<void> {
    try {
      await this.active?.disconnect();
    } catch (error) {
      logger.warn("Wallet disconnect failed", walletLogContext({
        code: normalizeWalletError(error).code,
        runtime: getRuntimeKind(),
        provider: this.session?.provider,
        recoverable: true,
      }));
    }
    this.unbindAdapter();
    this.session = null;
    this.error = null;
    await clearPersistedWalletSession();
    this.setStatus("disconnected");
  }

  async signMessage(message: string): Promise<{ signature: string; isDemo: boolean }> {
    if (!this.active || !this.session) {
      throw createWalletError("DISCONNECTED");
    }
    const signature = await this.active.signMessage(message);
    return { signature, isDemo: this.session.isDemo };
  }

  private async performConnect(requested: "auto" | "live"): Promise<WalletSession> {
    this.setStatus("connecting");
    this.error = null;
    try {
      const adapter = await this.selectLiveAdapter();
      if (!adapter) {
        if (requested === "live") {
          throw createWalletError("NO_PROVIDER");
        }
        return this.connectDemo();
      }
      const session = await adapter.connect();
      this.bindAdapter(adapter);
      this.session = session;
      await persistWalletSession(session);
      this.setStatus(session.chainId != null && !isSupportedChainId(session.chainId) ? "wrong-network" : "connected");
      return session;
    } catch (error) {
      const normalized = normalizeWalletError(error);
      this.error = normalized;
      logger.warn("Wallet connect failed", walletLogContext({
        code: normalized.code,
        runtime: getRuntimeKind(),
        provider: isNativeRuntime() ? "mobile" : "metamask",
        recoverable: normalized.recoverable,
      }));
      if (requested === "auto" && shouldAutoFallbackToDemo(error, await this.browser.isAvailable())) {
        return this.connectDemo();
      }
      this.setStatus(normalized.code === "USER_REJECTED" ? "rejected" : normalized.code === "NO_PROVIDER" || normalized.code === "PROVIDER_UNAVAILABLE" || normalized.code === "UNSUPPORTED_RUNTIME" ? "unavailable" : "error");
      throw Object.assign(new Error(normalized.message), { code: normalized.code, normalized });
    }
  }

  private async selectLiveAdapter(): Promise<WalletAdapter | null> {
    if (isBrowserRuntime() || getRuntimeKind() === "server" || getRuntimeKind() === "unknown") {
      if (await this.browser.isAvailable()) return this.browser;
    }
    if (isNativeRuntime() && (await this.mobile.isAvailable())) return this.mobile;
    return null;
  }

  private bindAdapter(adapter: WalletAdapter): void {
    this.unbindAdapter();
    this.active = adapter;
    this.unsubscribers = [
      adapter.onAccountsChanged((accounts) => {
        if (!accounts[0]) {
          this.session = null;
          this.setStatus("disconnected");
          void clearPersistedWalletSession();
          return;
        }
        if (this.session) {
          this.session = { ...this.session, address: accounts[0] };
          void persistWalletSession(this.session);
          this.emit();
        }
      }),
      adapter.onChainChanged((chainId) => {
        if (this.session) {
          this.session = { ...this.session, chainId };
          void persistWalletSession(this.session);
        }
        this.setStatus(isSupportedChainId(chainId) ? "connected" : "wrong-network");
      }),
      adapter.onDisconnect(() => {
        this.session = null;
        this.setStatus("disconnected");
        void clearPersistedWalletSession();
      }),
    ];
  }

  private unbindAdapter(): void {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
    this.active = null;
  }

  private setStatus(status: WalletStatus): void {
    this.status = status;
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

export function getWalletManager(): WalletManager {
  return WalletManager.getInstance();
}
