import { DEMO_ACCOUNT as DEMO_SESSION_ACCOUNT } from "@/lib/web3/session";

export type WalletProviderId = "metamask" | "mobile" | "demo";

export interface WalletSession {
  provider: WalletProviderId;
  address: string;
  chainId: number | null;
  connectedAt: number;
  isDemo: boolean;
}

export type WalletStatus =
  | "idle"
  | "detecting"
  | "available"
  | "connecting"
  | "connected"
  | "wrong-network"
  | "rejected"
  | "unavailable"
  | "error"
  | "disconnected";

export type Eip1193RequestArgs = {
  method: string;
  params?: unknown;
};

export type Eip1193Provider = {
  request: (args: Eip1193RequestArgs) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export interface WalletAdapter {
  readonly id: WalletProviderId;
  isAvailable(): Promise<boolean>;
  connect(): Promise<WalletSession>;
  disconnect(): Promise<void>;
  getSession(): Promise<WalletSession | null>;
  getChainId(): Promise<number | null>;
  signMessage(message: string): Promise<string>;
  onAccountsChanged(callback: (accounts: string[]) => void): () => void;
  onChainChanged(callback: (chainId: number) => void): () => void;
  onDisconnect(callback: () => void): () => void;
}

export type WalletConnectOptions = {
  mode?: "auto" | "live" | "demo";
};

export type WalletAdapterKind = "browser" | "react-native" | "demo";

export type WalletConnectionState = WalletStatus | "unsupported";

export interface WalletAccount {
  address: string;
  chainId: number | null;
  demo: boolean;
  label: "LIVE" | "DEMO";
}

export interface WalletUiSnapshot {
  state: WalletConnectionState;
  account: WalletAccount | null;
  errorMessage: string | null;
}

export interface CompanionWalletAdapter {
  readonly kind: WalletAdapterKind;
  isAvailable(): boolean;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getAccount(): Promise<WalletAccount | null>;
  getChainId(): Promise<number | null>;
}

export const DEMO_WALLET_ADDRESS = DEMO_SESSION_ACCOUNT;
export const DEMO_SIGNATURE = "DEMO_SIGNATURE";
export const WALLET_CONNECT_TIMEOUT_MS = 20_000;
export const WALLET_SESSION_STORAGE_KEY = "friendzone-wallet-session-v1";
