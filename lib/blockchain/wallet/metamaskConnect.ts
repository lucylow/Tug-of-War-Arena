/**
 * Isolated MetaMask Connect boundary.
 * The rest of the app talks to WalletAdapter, not this module.
 */
import { DEFAULT_HEX_CHAIN_ID, getDappMetadata, getSupportedNetworkMap } from "@/lib/web3/config";
import type { Eip1193Provider } from "./types";
import { createWalletError } from "./errors";
import { withTimeout, WALLET_CONNECT_TIMEOUT_MS } from "./timeout";
import { logger, walletLogContext } from "@/lib/logging/logger";
import { isNativeRuntime, getRuntimeKind } from "@/lib/runtime/runtime";

type MetaMaskConnectClient = {
  connect: (options?: { chainIds?: `0x${string}`[]; forceRequest?: boolean }) => Promise<{
    accounts: string[];
    chainId: `0x${string}`;
  }>;
  disconnect: () => Promise<void>;
  getProvider: () => Eip1193Provider;
  terminate?: () => Promise<void>;
};

let clientPromise: Promise<MetaMaskConnectClient | null> | null = null;

export function resetMetaMaskConnectForTests(): void {
  clientPromise = null;
}

export async function getMetaMaskConnectClient(): Promise<MetaMaskConnectClient | null> {
  if (!isNativeRuntime()) {
    return null;
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const [{ createEVMClient }, { Linking }] = await Promise.all([
          import("@metamask/connect-evm"),
          import("react-native"),
        ]);
        const dapp = getDappMetadata();
        return (await createEVMClient({
          dapp: {
            name: dapp.name,
            url: dapp.url,
            iconUrl: dapp.iconUrl,
          },
          api: {
            supportedNetworks: getSupportedNetworkMap(),
          },
          ui: {
            preferExtension: false,
            showInstallModal: false,
          },
          analytics: {
            enabled: false,
          },
          mobile: {
            preferredOpenLink: (deeplink: string) => {
              void Linking.openURL(deeplink).catch((error) => {
                logger.warn("Failed to open MetaMask deeplink", walletLogContext({
                  code: "PROVIDER_UNAVAILABLE",
                  runtime: getRuntimeKind(),
                  provider: "mobile",
                  recoverable: true,
                }));
                void error;
              });
            },
            useDeeplink: true,
          },
          debug: typeof __DEV__ !== "undefined" && Boolean(__DEV__),
          skipAutoAnnounce: true,
        })) as MetaMaskConnectClient;
      } catch (error) {
        logger.warn("MetaMask Connect init failed", walletLogContext({
          code: "PROVIDER_UNAVAILABLE",
          runtime: getRuntimeKind(),
          provider: "mobile",
          recoverable: true,
        }));
        void error;
        return null;
      }
    })();
  }
  return clientPromise;
}

export async function connectWithMetaMaskConnect(
  chainId: `0x${string}` = DEFAULT_HEX_CHAIN_ID,
): Promise<{ accounts: string[]; chainId: string; provider: Eip1193Provider }> {
  const client = await getMetaMaskConnectClient();
  if (!client) {
    throw createWalletError("UNSUPPORTED_RUNTIME");
  }
  const result = await withTimeout(
    client.connect({ chainIds: [chainId] }),
    WALLET_CONNECT_TIMEOUT_MS,
    "Wallet connection is taking too long.",
  );
  let provider: Eip1193Provider | null = null;
  try {
    provider = client.getProvider();
  } catch {
    provider = null;
  }
  if (!provider || typeof provider.request !== "function") {
    throw createWalletError("PROVIDER_UNAVAILABLE");
  }
  if (!result.accounts?.[0]) {
    throw createWalletError("PROVIDER_ERROR", "No accounts returned. Unlock MetaMask and select an account.");
  }
  return { ...result, provider };
}

export async function disconnectMetaMaskConnect(): Promise<void> {
  if (!clientPromise) return;
  try {
    const client = await getMetaMaskConnectClient();
    if (!client) return;
    if (typeof client.disconnect === "function") {
      await client.disconnect();
      return;
    }
    if (typeof client.terminate === "function") {
      await client.terminate();
    }
  } catch (error) {
    logger.warn("MetaMask Connect disconnect failed", walletLogContext({
      code: "DISCONNECTED",
      runtime: getRuntimeKind(),
      provider: "mobile",
      recoverable: true,
    }));
    void error;
  }
}
