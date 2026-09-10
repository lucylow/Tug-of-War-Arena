import { detectRuntime, isNativeRuntime } from "@/lib/runtime";
import { BrowserWalletAdapter } from "@/lib/blockchain/wallet/browserAdapter";
import { DemoWalletAdapter } from "@/lib/blockchain/wallet/demoAdapter";
import { MobileWalletAdapter } from "@/lib/blockchain/wallet/mobileAdapter";
import { getBrowserEthereumProvider } from "@/lib/blockchain/wallet/provider";
import type {
  CompanionWalletAdapter,
  WalletAccount,
  WalletAdapter,
  WalletAdapterKind,
  WalletSession,
} from "@/lib/blockchain/wallet/types";

function toAccount(session: WalletSession): WalletAccount {
  return {
    address: session.address,
    chainId: session.chainId,
    demo: session.isDemo,
    label: session.isDemo ? "DEMO" : "LIVE",
  };
}

function wrapAdapter(kind: WalletAdapterKind, adapter: WalletAdapter, available: () => boolean): CompanionWalletAdapter {
  return {
    kind,
    isAvailable: available,
    async connect() {
      return toAccount(await adapter.connect());
    },
    disconnect: () => adapter.disconnect(),
    async getAccount() {
      const session = await adapter.getSession();
      return session ? toAccount(session) : null;
    },
    getChainId: () => adapter.getChainId(),
  };
}

const browserRuntime = new BrowserWalletAdapter();
const mobileRuntime = new MobileWalletAdapter();
const demoRuntime = new DemoWalletAdapter();

const adapters: Record<WalletAdapterKind, CompanionWalletAdapter> = {
  browser: wrapAdapter("browser", browserRuntime, () => getBrowserEthereumProvider() != null),
  "react-native": wrapAdapter("react-native", mobileRuntime, () => isNativeRuntime()),
  demo: wrapAdapter("demo", demoRuntime, () => true),
};

export function getWalletAdapter(): CompanionWalletAdapter {
  const runtime = detectRuntime();
  if (runtime === "decentraland" || runtime === "server") return adapters.demo;
  if (isNativeRuntime(runtime)) return adapters["react-native"];
  if (getBrowserEthereumProvider()) return adapters.browser;
  return adapters.demo;
}

export function getDemoWalletAdapter(): CompanionWalletAdapter {
  return adapters.demo;
}

export function getWalletAdapterByKind(kind: WalletAdapterKind): CompanionWalletAdapter {
  return adapters[kind];
}
