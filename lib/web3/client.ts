import { DAPP_METADATA, DEFAULT_HEX_CHAIN_ID, getSupportedNetworkMap } from "@/lib/web3/config";
import { getInjectedProvider } from "@/lib/web3/detect";
import { getWalletErrorDetail, toWalletError } from "@/lib/web3/errors";
import type { Eip1193Like, Eip1193RequestArgs } from "@/lib/web3/types";

type MetaMaskClient = {
  connect: (options?: { chainIds?: `0x${string}`[]; forceRequest?: boolean }) => Promise<{
    accounts: string[];
    chainId: `0x${string}`;
  }>;
  disconnect: () => Promise<void>;
  switchChain: (options: { chainId: `0x${string}`; chainConfiguration?: Record<string, unknown> }) => Promise<void>;
  getProvider: () => Eip1193Like;
  terminate?: () => Promise<void>;
};

export const WALLET_REQUEST_TIMEOUT_MS = 90_000;

let clientPromise: Promise<MetaMaskClient | null> | null = null;

export function resetMetaMaskClientForTests(): void {
  clientPromise = null;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(Object.assign(new Error(message), { code: "TIMEOUT" }));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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

export async function getMetaMaskClient(): Promise<MetaMaskClient | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const [{ createEVMClient }, { Linking, Platform }] = await Promise.all([
          import("@metamask/connect-evm"),
          import("react-native"),
        ]);
        return (await createEVMClient({
          dapp: {
            name: DAPP_METADATA.name,
            url: DAPP_METADATA.url,
            iconUrl: DAPP_METADATA.iconUrl,
          },
          api: {
            supportedNetworks: getSupportedNetworkMap(),
          },
          ui: {
            preferExtension: Platform.OS === "web",
            showInstallModal: false,
          },
          analytics: {
            enabled: false,
          },
          mobile: {
            preferredOpenLink: (deeplink: string) => {
              void Linking.openURL(deeplink).catch((error) => {
                logWalletFailure("Failed to open MetaMask deeplink", error);
              });
            },
            useDeeplink: true,
          },
          debug: isDevMode(),
          skipAutoAnnounce: true,
        })) as unknown as MetaMaskClient;
      } catch (error) {
        logWalletFailure("MetaMask Connect init failed", error);
        return null;
      }
    })();
  }
  return clientPromise;
}

export async function getLiveProvider(): Promise<Eip1193Like | null> {
  const injected = getInjectedProvider();
  if (injected) return injected;
  const client = await getMetaMaskClient();
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
  const accounts = await requestWallet(provider, { method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || !accounts[0]) {
    throw new Error("No accounts returned. Unlock MetaMask and select an account.");
  }
  let rawChainId = chainId;
  try {
    const nextChainId = await requestWallet(provider, { method: "eth_chainId" });
    if (typeof nextChainId === "string" && nextChainId) rawChainId = nextChainId as `0x${string}`;
  } catch (error) {
    logWalletFailure("MetaMask chain id read failed after connect", error);
  }
  return { accounts, chainId: rawChainId, provider };
}

async function connectSdkSession(
  chainId: `0x${string}`,
): Promise<{ accounts: string[]; chainId: string; provider: Eip1193Like } | null> {
  const client = await getMetaMaskClient();
  if (!client) return null;
  const result = await withTimeout(
    client.connect({ chainIds: [chainId] }),
    WALLET_REQUEST_TIMEOUT_MS,
    "MetaMask did not respond. Unlock the extension or close a stuck popup, then try again.",
  );
  let provider: Eip1193Like | null = null;
  try {
    provider = client.getProvider();
  } catch (error) {
    logWalletFailure("MetaMask client provider failed after connect", error);
    provider = null;
  }
  if (!provider) throw new Error("MetaMask is not available on this device.");
  if (!result.accounts?.[0]) {
    throw new Error("No accounts returned. Unlock MetaMask and select an account.");
  }
  return { ...result, provider };
}

export async function connectLiveSession(chainId = DEFAULT_HEX_CHAIN_ID): Promise<{
  accounts: string[];
  chainId: string;
  provider: Eip1193Like;
}> {
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

    try {
      const sdkSession = await connectSdkSession(chainId);
      if (sdkSession) return sdkSession;
    } catch (error) {
      logWalletFailure("MetaMask Connect SDK connect failed", error);
      throw error;
    }

    throw new Error("MetaMask is not available on this device.");
  } catch (error) {
    throw toWalletError(error);
  }
}

export async function disconnectLiveSession(): Promise<void> {
  if (!clientPromise) return;
  try {
    const client = await getMetaMaskClient();
    if (!client) return;
    if (typeof client.disconnect === "function") {
      await client.disconnect();
      return;
    }
    if (typeof client.terminate === "function") {
      await client.terminate();
    }
  } catch (error) {
    logWalletFailure("MetaMask disconnect failed", error);
  }
}
