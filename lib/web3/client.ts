import { DEFAULT_HEX_CHAIN_ID } from "@/lib/web3/config";
import { getInjectedProvider } from "@/lib/web3/detect";
import { getWalletErrorDetail, toWalletError } from "@/lib/web3/errors";
import type { Eip1193Like, Eip1193RequestArgs } from "@/lib/web3/types";
import { isNativeRuntime } from "@/lib/runtime/runtime";
import { WALLET_CONNECT_TIMEOUT_MS, withTimeout } from "@/lib/blockchain/wallet/timeout";
import {
  connectWithMetaMaskConnect,
  disconnectMetaMaskConnect,
  getMetaMaskConnectClient,
  resetMetaMaskConnectForTests,
} from "@/lib/blockchain/wallet/metamaskConnect";
import { createWalletError } from "@/lib/blockchain/wallet/errors";

export const WALLET_REQUEST_TIMEOUT_MS = 90_000;

let activeConnection: Promise<{ accounts: string[]; chainId: string; provider: Eip1193Like }> | null = null;

export function resetMetaMaskClientForTests(): void {
  resetMetaMaskConnectForTests();
  activeConnection = null;
}

export async function requestWallet(
  provider: Eip1193Like,
  args: Eip1193RequestArgs,
  timeoutMs = WALLET_REQUEST_TIMEOUT_MS,
): Promise<unknown> {
  let pending: Promise<unknown>;
  try {
    pending = Promise.resolve(provider.request(args));
  } catch (error) {
    throw error;
  }
  return withTimeout(
    pending,
    timeoutMs,
    "MetaMask did not respond. Unlock the extension or close a stuck popup, then try again.",
  );
}

function isDevMode(): boolean {
  return typeof globalThis !== "undefined" && Boolean((globalThis as { __DEV__?: boolean }).__DEV__);
}

function logWalletFailure(context: string, error: unknown): void {
  if (!isDevMode()) return;
  console.warn(`${context}:`, getWalletErrorDetail(error), error);
}

export async function getMetaMaskClient(): Promise<Awaited<ReturnType<typeof getMetaMaskConnectClient>>> {
  return getMetaMaskConnectClient();
}

export async function getLiveProvider(): Promise<Eip1193Like | null> {
  const injected = getInjectedProvider();
  if (injected) return injected;
  if (!isNativeRuntime()) return null;
  const client = await getMetaMaskConnectClient();
  try {
    return client?.getProvider() ?? null;
  } catch (error) {
    logWalletFailure("MetaMask provider is unavailable", error);
    return null;
  }
}

async function connectInjectedSession(
  provider: Eip1193Like,
  chainId: `0x${string}`,
): Promise<{ accounts: string[]; chainId: string; provider: Eip1193Like }> {
  const accounts = await requestWallet(provider, { method: "eth_requestAccounts" }, WALLET_CONNECT_TIMEOUT_MS);
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || !accounts[0]) {
    throw new Error("No accounts returned. Unlock MetaMask and select an account.");
  }
  let rawChainId = chainId;
  try {
    const nextChainId = await requestWallet(provider, { method: "eth_chainId" }, WALLET_CONNECT_TIMEOUT_MS);
    if (typeof nextChainId === "string" && nextChainId) rawChainId = nextChainId as `0x${string}`;
  } catch (error) {
    logWalletFailure("MetaMask chain id read failed after connect", error);
  }
  return { accounts, chainId: rawChainId, provider };
}

export async function connectLiveSession(chainId = DEFAULT_HEX_CHAIN_ID): Promise<{
  accounts: string[];
  chainId: string;
  provider: Eip1193Like;
}> {
  if (activeConnection) return activeConnection;
  activeConnection = (async () => {
    try {
      const injected = getInjectedProvider();
      if (injected) {
        try {
          return await connectInjectedSession(injected, chainId);
        } catch (error) {
          logWalletFailure("Injected MetaMask connect failed", error);
          throw error;
        }
      }

      if (isNativeRuntime()) {
        try {
          const sdkSession = await connectWithMetaMaskConnect(chainId);
          return sdkSession;
        } catch (error) {
          logWalletFailure("MetaMask Connect SDK connect failed", error);
          throw error;
        }
      }

      throw createWalletError("NO_PROVIDER", "MetaMask is not available on this device.");
    } catch (error) {
      throw toWalletError(error);
    }
  })();
  try {
    return await activeConnection;
  } finally {
    activeConnection = null;
  }
}

export async function disconnectLiveSession(): Promise<void> {
  try {
    await disconnectMetaMaskConnect();
  } catch (error) {
    logWalletFailure("MetaMask disconnect failed", error);
  }
}
