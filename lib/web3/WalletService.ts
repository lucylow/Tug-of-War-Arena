import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";

import { DemoModeManager } from "@/lib/mock/DemoModeManager";
import { connectLiveSession, disconnectLiveSession } from "@/lib/web3/client";
import { DEFAULT_CHAIN_ID, WALLET_ACCOUNT_STORAGE_KEY } from "@/lib/web3/config";
import { shouldFallbackToDemo, toUserFacingError, toWalletError } from "@/lib/web3/errors";
import { parseChainId } from "@/lib/web3/format";
import { DEMO_ACCOUNT } from "@/lib/web3/session";
import { switchEthereumChain } from "@/lib/web3/switch-chain";
import type { Eip1193Like } from "@/lib/web3/types";

async function writeStoredAccount(address: string): Promise<void> {
  try {
    await AsyncStorage.setItem(WALLET_ACCOUNT_STORAGE_KEY, address);
  } catch {
    // In-memory session still works if local storage is unavailable.
  }
}

async function clearStoredAccount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WALLET_ACCOUNT_STORAGE_KEY);
  } catch {
    // Disconnect still clears in-memory session.
  }
}

export interface WalletInfo {
  address: string;
  chainId: number;
  balance: string;
  isConnected: boolean;
}

/**
 * Non-React wallet client used by hooks and tests.
 * Live sessions go through MetaMask Connect; demo sessions stay local.
 */
export class WalletService {
  private static instance: WalletService | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;
  private chainId: number | null = null;
  private ethProvider: Eip1193Like | null = null;

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  static resetForTests(): void {
    WalletService.instance = null;
  }

  async adoptLive(ethProvider: Eip1193Like, address: string, chainId: number, balance?: string): Promise<WalletInfo> {
    this.ethProvider = ethProvider;
    const provider = new ethers.BrowserProvider(ethProvider as ethers.Eip1193Provider);
    this.provider = provider;
    this.address = address;
    this.chainId = chainId;
    try {
      this.signer = await provider.getSigner();
    } catch {
      this.signer = null;
    }
    await writeStoredAccount(address);
    let nextBalance = balance;
    if (nextBalance == null) {
      try {
        nextBalance = ethers.formatEther(await provider.getBalance(address));
      } catch {
        nextBalance = "0";
      }
    }
    return {
      address,
      chainId,
      balance: nextBalance,
      isConnected: true,
    };
  }

  async connect(): Promise<WalletInfo> {
    try {
      const live = await connectLiveSession();
      const address = live.accounts[0];
      if (!address) throw new Error("No accounts returned");
      return this.adoptLive(live.provider, address, parseChainId(live.chainId) ?? DEFAULT_CHAIN_ID);
    } catch (error) {
      if (!shouldFallbackToDemo(error)) throw toWalletError(error);
      DemoModeManager.getInstance().ensureEnabled();
      DemoModeManager.getInstance().setFallbackReason("live-unavailable");
      return this.connectDemo(this.chainId ?? DEFAULT_CHAIN_ID);
    }
  }

  async connectDemo(chainId: number): Promise<WalletInfo> {
    DemoModeManager.getInstance().ensureEnabled();
    this.provider = null;
    this.signer = null;
    this.ethProvider = null;
    this.address = DEMO_ACCOUNT;
    this.chainId = chainId;
    await writeStoredAccount(DEMO_ACCOUNT);
    let mockBalance = 0;
    try {
      mockBalance = await DemoModeManager.getInstance().getOrCreateService().getBalance(DEMO_ACCOUNT);
    } catch {
      mockBalance = 0;
    }
    return {
      address: DEMO_ACCOUNT,
      chainId,
      balance: String(mockBalance),
      isConnected: true,
    };
  }

  async disconnect(): Promise<void> {
    try {
      await disconnectLiveSession();
    } catch {
      // Local demo sessions still clear below.
    }
    this.provider = null;
    this.signer = null;
    this.ethProvider = null;
    this.address = null;
    this.chainId = null;
    await clearStoredAccount();
  }

  getAddress(): string | null {
    return this.address;
  }

  getChainId(): number | null {
    return this.chainId;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  isConnected(): boolean {
    return this.address !== null;
  }

  isLive(): boolean {
    return this.ethProvider !== null && this.address !== null;
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.address) return "0";
    try {
      const balance = await this.provider.getBalance(this.address);
      return ethers.formatEther(balance);
    } catch {
      return "0";
    }
  }

  async switchNetwork(targetChainId: number): Promise<void> {
    if (!this.ethProvider) {
      this.chainId = targetChainId;
      return;
    }
    try {
      await switchEthereumChain(this.ethProvider, targetChainId);
      this.chainId = targetChainId;
    } catch (error) {
      throw toWalletError(error);
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) throw new Error("Connect MetaMask to sign a message.");
    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      throw toWalletError(error);
    }
  }

  async sendTransaction(to: string, amount: string): Promise<string> {
    if (!this.signer) throw new Error("Connect MetaMask to send a live transaction.");
    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });
      const receipt = await tx.wait();
      if (!receipt?.hash && !tx.hash) {
        throw new Error("Transaction was submitted but no hash was returned.");
      }
      return receipt?.hash ?? tx.hash;
    } catch (error) {
      throw toUserFacingError(error);
    }
  }
}
