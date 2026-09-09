import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ethers, type InterfaceAbi } from "ethers";

import { addChainParams, DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import { connectLiveSession, disconnectLiveSession } from "@/lib/web3/client";
import { parseChainId, toHexChainId } from "@/lib/web3/format";
import { DEMO_ACCOUNT, formatWalletError, shouldFallbackToDemo } from "@/lib/web3/session";
import type { ConnectionMode, ConnectModeRequest, Eip1193Like } from "@/lib/web3/types";

export type WalletContextValue = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  connectionMode: ConnectionMode | null;
  connect: (options?: { mode?: ConnectModeRequest }) => Promise<ConnectionMode>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  sendTransaction: (to: string, amount: string, data?: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  getContract: (address: string, abi: InterfaceAbi) => ethers.Contract;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const ethProviderRef = useRef<Eip1193Like | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode | null>(null);

  const clearSession = useCallback(() => {
    ethProviderRef.current = null;
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setBalance(null);
    setConnectionMode(null);
  }, []);

  const applyDemoSession = useCallback(() => {
    ethProviderRef.current = null;
    setProvider(null);
    setSigner(null);
    setAccount(DEMO_ACCOUNT);
    setChainId(DEFAULT_CHAIN_ID);
    setBalance(null);
    setIsConnected(true);
    setConnectionMode("demo");
  }, []);

  const applyLiveSession = useCallback(async (ethProvider: Eip1193Like, address: string, nextChainId: number) => {
    ethProviderRef.current = ethProvider;
    const ethersProvider = new ethers.BrowserProvider(ethProvider as ethers.Eip1193Provider);
    setProvider(ethersProvider);
    setAccount(address);
    setChainId(nextChainId);
    setIsConnected(true);
    setConnectionMode("live");
    try {
      setSigner(await ethersProvider.getSigner());
    } catch {
      setSigner(null);
    }
    try {
      setBalance(ethers.formatEther(await ethersProvider.getBalance(address)));
    } catch {
      setBalance("0");
    }
  }, []);

  const connect = useCallback(async (options?: { mode?: ConnectModeRequest }) => {
    const requested = options?.mode ?? "auto";
    setIsConnecting(true);
    try {
      if (requested === "demo") {
        applyDemoSession();
        return "demo" as const;
      }
      try {
        const live = await connectLiveSession();
        const address = live.accounts[0];
        if (!address) throw new Error("No accounts returned");
        await applyLiveSession(live.provider, address, parseChainId(live.chainId) ?? DEFAULT_CHAIN_ID);
        return "live" as const;
      } catch (error) {
        if (requested === "live" || !shouldFallbackToDemo(error)) {
          throw new Error(formatWalletError(error));
        }
        applyDemoSession();
        return "demo" as const;
      }
    } finally {
      setIsConnecting(false);
    }
  }, [applyDemoSession, applyLiveSession]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectLiveSession();
    } catch {
      // Demo and injected sessions can still clear locally.
    }
    clearSession();
  }, [clearSession]);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (connectionMode === "demo") {
      setChainId(targetChainId);
      return;
    }
    const ethProvider = ethProviderRef.current;
    if (!ethProvider) throw new Error("No wallet provider available");
    try {
      await ethProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHexChainId(targetChainId) }],
      });
      setChainId(targetChainId);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? Number((error as { code: number }).code) : 0;
      const network = addChainParams(targetChainId);
      if (code === 4902 && network) {
        await ethProvider.request({
          method: "wallet_addEthereumChain",
          params: [network],
        });
        setChainId(targetChainId);
        return;
      }
      throw error;
    }
  }, [connectionMode]);

  const sendTransaction = useCallback(async (to: string, amount: string, data?: string) => {
    if (!signer) throw new Error("Connect MetaMask to send a live transaction.");
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount),
      data: data || "0x",
    });
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }, [signer]);

  const signMessage = useCallback(async (message: string) => {
    if (!signer) throw new Error("Connect MetaMask to sign a message.");
    return signer.signMessage(message);
  }, [signer]);

  const getContract = useCallback((address: string, abi: InterfaceAbi) => {
    const runner = signer ?? provider;
    if (!runner) throw new Error("Wallet not connected");
    return new ethers.Contract(address, abi, runner);
  }, [provider, signer]);

  const value = useMemo<WalletContextValue>(() => ({
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isConnecting,
    balance,
    connectionMode,
    connect,
    disconnect,
    switchNetwork,
    sendTransaction,
    signMessage,
    getContract,
  }), [account, balance, chainId, connect, connectionMode, disconnect, getContract, isConnected, isConnecting, provider, sendTransaction, signMessage, signer, switchNetwork]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within MetaMaskProvider");
  }
  return context;
}
