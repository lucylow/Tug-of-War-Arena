import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";

import { connectLiveSession, disconnectLiveSession } from "@/lib/web3/client";
import { WALLET_ACCOUNT_STORAGE_KEY } from "@/lib/web3/config";
import { parseChainId } from "@/lib/web3/format";
import { DEMO_ACCOUNT } from "@/lib/web3/session";
import type { Eip1193Like } from "@/lib/web3/types";

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

  async connect(): Promise<WalletInfo> {
    const live = await connectLiveSession();
    const address = live.accounts[0];
    if (!address) throw new Error("No accounts returned");

    this.ethProvider = live.provider;
    const provider = new ethers.BrowserProvider(live.provider as ethers.Eip1193Provider);
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(address);

    this.provider = provider;
    this.signer = await provider.getSigner();
    this.address = address;
    this.chainId = parseChainId(network.chainId) ?? Number(network.chainId);

    await AsyncStorage.setItem(WALLET_ACCOUNT_STORAGE_KEY, address);

    return {
      address,
      chainId: this.chainId,
      balance: ethers.formatEther(balance),
      isConnected: true,
    };
  }

  async connectDemo(chainId: number): Promise<WalletInfo> {
    this.provider = null;
    this.signer = null;
    this.ethProvider = null;
    this.address = DEMO_ACCOUNT;
    this.chainId = chainId;
    await AsyncStorage.setItem(WALLET_ACCOUNT_STORAGE_KEY, DEMO_ACCOUNT);
    return {
      address: DEMO_ACCOUNT,
      chainId,
      balance: "0",
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
    await AsyncStorage.removeItem(WALLET_ACCOUNT_STORAGE_KEY);
  }

  getAddress(): string | null {
    return this.address;
  }

  getChainId(): number | null {
    return this.chainId;
  }

  isConnected(): boolean {
    return this.address !== null;
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.address) return "0";
    const balance = await this.provider.getBalance(this.address);
    return ethers.formatEther(balance);
  }

  async switchNetwork(targetChainId: number): Promise<void> {
    if (!this.ethProvider) {
      this.chainId = targetChainId;
      return;
    }
    await this.ethProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${targetChainId.toString(16)}` }],
    });
    this.chainId = targetChainId;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) throw new Error("No signer available");
    return this.signer.signMessage(message);
  }

  async sendTransaction(to: string, amount: string): Promise<string> {
    if (!this.signer) throw new Error("No signer available");
    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }
}
