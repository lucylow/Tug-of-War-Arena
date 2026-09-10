import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ethers, type InterfaceAbi } from "ethers";

import { getDemoWalletAdapter, getWalletAdapter } from "@/lib/blockchain";
import { isWrongNetwork } from "@/lib/blockchain/network";
import { normalizeWalletError, safeWalletDiagnostic, type NormalizedWalletError } from "@/lib/blockchain/wallet/errors";
import type { WalletConnectionState } from "@/lib/blockchain/wallet/types";
import { DemoModeManager } from "@/lib/mock/DemoModeManager";
import { canAccessBrowserEthereum } from "@/lib/runtime";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import { connectLiveSession, disconnectLiveSession } from "@/lib/web3/client";
import { getInjectedProvider } from "@/lib/web3/detect";
import { formatWalletError, shouldFallbackToDemo, toUserFacingError, toWalletError } from "@/lib/web3/errors";
import { parseChainId } from "@/lib/web3/format";
import { DEMO_IDENTITY_ADDRESS } from "@/lib/web3/session";
import { switchEthereumChain } from "@/lib/web3/switch-chain";
import type { ConnectionMode, ConnectModeRequest, Eip1193Like } from "@/lib/web3/types";
import { WalletService } from "@/lib/web3/WalletService";

export type WalletContextValue = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  connectionMode: ConnectionMode | null;
  walletState: WalletConnectionState;
  walletError: NormalizedWalletError | null;
  connect: (options?: { mode?: ConnectModeRequest }) => Promise<ConnectionMode>;
  continueDemo: () => Promise<ConnectionMode>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<string | null>;
  sendTransaction: (to: string, amount: string, data?: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  getContract: (address: string, abi: InterfaceAbi) => ethers.Contract;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const ethProviderRef = useRef<Eip1193Like | null>(null);
  const accountRef = useRef<string | null>(null);
  const chainIdRef = useRef<number | null>(null);
  const listenersRef = useRef<{
    accounts?: (...args: unknown[]) => void;
    chain?: (...args: unknown[]) => void;
    disconnect?: (...args: unknown[]) => void;
  }>({});
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode | null>(null);
  const [walletState, setWalletState] = useState<WalletConnectionState>("available");
  const [walletError, setWalletError] = useState<NormalizedWalletError | null>(null);

  const detachProviderListeners = useCallback(() => {
    const ethProvider = ethProviderRef.current;
    const listeners = listenersRef.current;
    if (ethProvider?.removeListener) {
      if (listeners.accounts) ethProvider.removeListener("accountsChanged", listeners.accounts);
      if (listeners.chain) ethProvider.removeListener("chainChanged", listeners.chain);
      if (listeners.disconnect) ethProvider.removeListener("disconnect", listeners.disconnect);
    }
    listenersRef.current = {};
  }, []);

  const clearSession = useCallback(() => {
    detachProviderListeners();
    ethProviderRef.current = null;
    accountRef.current = null;
    chainIdRef.current = null;
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setBalance(null);
    setConnectionMode(null);
    setWalletState("available");
    setWalletError(null);
  }, [detachProviderListeners]);

  const applyDemoSession = useCallback(() => {
    const manager = DemoModeManager.getInstance();
    manager.ensureEnabled();
    manager.setFallbackReason("demo-session");
    detachProviderListeners();
    ethProviderRef.current = null;
    accountRef.current = null;
    setProvider(null);
    setSigner(null);
    void getDemoWalletAdapter().connect().then((demo) => {
      setAccount(demo.address);
      setChainId(demo.chainId ?? DEFAULT_CHAIN_ID);
    }).catch(() => {
      setAccount(DEMO_IDENTITY_ADDRESS);
      setChainId(DEFAULT_CHAIN_ID);
    });
    setAccount(DEMO_IDENTITY_ADDRESS);
    setChainId(DEFAULT_CHAIN_ID);
    setBalance(null);
    setIsConnected(true);
    setConnectionMode("demo");
    setWalletState("connected");
    setWalletError(null);
    void WalletService.getInstance().connectDemo(DEFAULT_CHAIN_ID);
    void manager
      .getOrCreateService()
      .getBalance(DEMO_IDENTITY_ADDRESS)
      .then((value) => setBalance(String(value)))
      .catch(() => setBalance("0"));
  }, [detachProviderListeners]);

  const applyLiveSession = useCallback(async (ethProvider: Eip1193Like, address: string, nextChainId: number) => {
    ethProviderRef.current = ethProvider;
    accountRef.current = address;
    chainIdRef.current = nextChainId;
    const ethersProvider = new ethers.BrowserProvider(ethProvider as ethers.Eip1193Provider);
    setProvider(ethersProvider);
    setAccount(address);
    setChainId(nextChainId);
    setIsConnected(true);
    setConnectionMode("live");
    setWalletState(isWrongNetwork(nextChainId) ? "wrong-network" : "connected");
    setWalletError(null);
    try {
      setSigner(await ethersProvider.getSigner());
    } catch {
      setSigner(null);
    }
    let nextBalance = "0";
    try {
      nextBalance = ethers.formatEther(await ethersProvider.getBalance(address));
    } catch {
      nextBalance = "0";
    }
    setBalance(nextBalance);
    await WalletService.getInstance().adoptLive(ethProvider, address, nextChainId, nextBalance);

    detachProviderListeners();
    const onAccounts = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      const nextAccount = accounts[0];
      if (!nextAccount) {
        clearSession();
        void WalletService.getInstance().disconnect();
        return;
      }
      void applyLiveSession(ethProvider, nextAccount, chainIdRef.current ?? nextChainId).catch((error) => {
        if (__DEV__) console.warn("MetaMask account update failed:", formatWalletError(error), error);
      });
    };
    const onChain = (...args: unknown[]) => {
      const next = parseChainId(typeof args[0] === "string" || typeof args[0] === "number" || typeof args[0] === "bigint" ? args[0] : String(args[0] ?? ""));
      if (next == null) return;
      const currentAccount = accountRef.current ?? address;
      void applyLiveSession(ethProvider, currentAccount, next).catch((error) => {
        if (__DEV__) console.warn("MetaMask network update failed:", formatWalletError(error), error);
      });
    };
    const onDisconnect = () => {
      clearSession();
      void WalletService.getInstance().disconnect();
    };
    ethProvider.on?.("accountsChanged", onAccounts);
    ethProvider.on?.("chainChanged", onChain);
    ethProvider.on?.("disconnect", onDisconnect);
    listenersRef.current = { accounts: onAccounts, chain: onChain, disconnect: onDisconnect };
  }, [clearSession, detachProviderListeners]);

  const connect = useCallback(async (options?: { mode?: ConnectModeRequest }) => {
    const requested = options?.mode ?? "auto";
    setIsConnecting(true);
    setWalletState("connecting");
    setWalletError(null);
    try {
      if (requested === "demo") {
        applyDemoSession();
        return "demo" as const;
      }
      const adapter = getWalletAdapter();
      if (adapter.kind === "demo") {
        if (requested === "live") {
          const normalized = normalizeWalletError(new Error("MetaMask is not available on this device."));
          setWalletError(normalized);
          setWalletState("unsupported");
          throw toWalletError(new Error(normalized.message));
        }
        DemoModeManager.getInstance().setFallbackReason("live-unavailable");
        applyDemoSession();
        return "demo" as const;
      }
      try {
        const live = await connectLiveSession();
        const address = live.accounts[0];
        if (!address) throw new Error("No accounts returned. Unlock MetaMask and select an account.");
        await applyLiveSession(live.provider, address, parseChainId(live.chainId) ?? DEFAULT_CHAIN_ID);
        return "live" as const;
      } catch (error) {
        const normalized = normalizeWalletError(error);
        if (__DEV__) console.warn("Wallet connect failed:", safeWalletDiagnostic(error), formatWalletError(error));
        setWalletError(normalized);
        setWalletState(normalized.code === "USER_REJECTED" ? "rejected" : "error");
        if (requested === "live" || !shouldFallbackToDemo(error)) {
          throw toWalletError(error);
        }
        DemoModeManager.getInstance().setFallbackReason("live-unavailable");
        applyDemoSession();
        return "demo" as const;
      }
    } catch (error) {
      const normalized = normalizeWalletError(error);
      setWalletError(normalized);
      setWalletState(normalized.code === "USER_REJECTED" ? "rejected" : normalized.code === "UNSUPPORTED_RUNTIME" ? "unsupported" : "error");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [applyDemoSession, applyLiveSession]);

  const continueDemo = useCallback(async () => {
    applyDemoSession();
    return "demo" as const;
  }, [applyDemoSession]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectLiveSession();
    } catch {
      // Demo and injected sessions can still clear locally.
    }
    try {
      await WalletService.getInstance().disconnect();
    } catch {
      // Local state still clears below.
    }
    clearSession();
  }, [clearSession]);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (connectionMode === "demo") {
      setChainId(targetChainId);
      await WalletService.getInstance().switchNetwork(targetChainId);
      return;
    }
    const ethProvider = ethProviderRef.current;
    if (!ethProvider) throw new Error("No wallet provider available");
    try {
      await switchEthereumChain(ethProvider, targetChainId);
      setChainId(targetChainId);
      if (account) {
        await applyLiveSession(ethProvider, account, targetChainId);
      }
    } catch (error) {
      throw toWalletError(error);
    }
  }, [account, applyLiveSession, connectionMode]);

  const refreshBalance = useCallback(async () => {
    if (connectionMode === "demo" && account) {
      try {
        const value = await DemoModeManager.getInstance().getOrCreateService().getBalance(account);
        const formatted = String(value);
        setBalance(formatted);
        return formatted;
      } catch {
        setBalance("0");
        return "0";
      }
    }
    if (!provider || !account) return balance;
    try {
      const formatted = ethers.formatEther(await provider.getBalance(account));
      setBalance(formatted);
      return formatted;
    } catch {
      setBalance("0");
      return "0";
    }
  }, [account, balance, connectionMode, provider]);

  const sendTransaction = useCallback(async (to: string, amount: string, data?: string) => {
    if (!signer) throw new Error("Connect MetaMask to send a live transaction.");
    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
        data: data || "0x",
      });
      const receipt = await tx.wait();
      void refreshBalance().catch(() => undefined);
      if (!receipt?.hash && !tx.hash) {
        throw new Error("Transaction was submitted but no hash was returned.");
      }
      return receipt?.hash ?? tx.hash;
    } catch (error) {
      throw toUserFacingError(error);
    }
  }, [refreshBalance, signer]);

  const signMessage = useCallback(async (message: string) => {
    if (connectionMode === "demo") {
      return "DEMO_SIGNATURE";
    }
    if (!signer) throw new Error("Connect MetaMask to sign a message.");
    try {
      return await signer.signMessage(message);
    } catch (error) {
      throw toWalletError(error);
    }
  }, [connectionMode, signer]);

  const getContract = useCallback((address: string, abi: InterfaceAbi) => {
    const runner = signer ?? provider;
    if (!runner) throw new Error("Wallet not connected");
    return new ethers.Contract(address, abi, runner);
  }, [provider, signer]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!canAccessBrowserEthereum()) return;
      const injected = getInjectedProvider();
      if (!injected) return;
      try {
        const accounts = (await injected.request({ method: "eth_accounts" })) as string[];
        if (cancelled || !accounts?.[0]) return;
        const rawChainId = (await injected.request({ method: "eth_chainId" })) as string;
        await applyLiveSession(injected, accounts[0], parseChainId(rawChainId) ?? DEFAULT_CHAIN_ID);
      } catch (error) {
        if (__DEV__) console.warn("MetaMask session restore skipped:", safeWalletDiagnostic(error), formatWalletError(error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyLiveSession]);

  const value = useMemo<WalletContextValue>(() => ({
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isConnecting,
    balance,
    connectionMode,
    walletState,
    walletError,
    connect,
    continueDemo,
    disconnect,
    switchNetwork,
    refreshBalance,
    sendTransaction,
    signMessage,
    getContract,
  }), [account, balance, chainId, connect, continueDemo, connectionMode, disconnect, getContract, isConnected, isConnecting, provider, refreshBalance, sendTransaction, signMessage, signer, switchNetwork, walletError, walletState]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within MetaMaskProvider");
  }
  return context;
}
