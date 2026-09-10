export type WalletAdapterKind = "browser" | "mobile" | "demo";

export type WalletCapabilityState = "disconnected" | "demo" | "connected" | "wrong_network" | "unavailable";

export interface WalletAdapterState {
  kind: WalletAdapterKind;
  status: WalletCapabilityState;
  address: string | null;
  chainId: number | null;
  connectedAt: number | null;
}

export interface WalletAdapter {
  kind: WalletAdapterKind;
  detect(): Promise<boolean>;
  connect(): Promise<WalletAdapterState>;
  disconnect(): Promise<void>;
  getState(): WalletAdapterState;
}
