import { DEMO_SIGNATURE, DEMO_WALLET_ADDRESS, type WalletAdapter, type WalletSession } from "./types";
import { persistWalletSession } from "./storage";
import { WalletEventBus } from "./events";

export class DemoWalletAdapter implements WalletAdapter {
  readonly id = "demo" as const;
  private session: WalletSession | null = null;
  private readonly bus = new WalletEventBus();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async connect(): Promise<WalletSession> {
    this.session = {
      provider: "demo",
      address: DEMO_WALLET_ADDRESS,
      chainId: null,
      connectedAt: Date.now(),
      isDemo: true,
    };
    await persistWalletSession(this.session);
    return this.session;
  }

  async disconnect(): Promise<void> {
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
    return DEMO_SIGNATURE;
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
