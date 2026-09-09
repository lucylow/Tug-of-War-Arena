import { Linking, Platform } from "react-native";

import { DAPP_METADATA, DEFAULT_HEX_CHAIN_ID, getSupportedNetworkMap } from "@/lib/web3/config";
import { getInjectedProvider } from "@/lib/web3/detect";
import type { Eip1193Like } from "@/lib/web3/types";

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

let clientPromise: Promise<MetaMaskClient | null> | null = null;

export async function getMetaMaskClient(): Promise<MetaMaskClient | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const { createEVMClient } = await import("@metamask/connect-evm");
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
                console.error("Failed to open MetaMask deeplink:", error);
              });
            },
            useDeeplink: true,
          },
          debug: __DEV__,
        })) as unknown as MetaMaskClient;
      } catch (error) {
        console.error("MetaMask Connect init failed:", error);
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
  } catch {
    return null;
  }
}

export async function connectLiveSession(chainId = DEFAULT_HEX_CHAIN_ID): Promise<{
  accounts: string[];
  chainId: string;
  provider: Eip1193Like;
}> {
  const client = await getMetaMaskClient();
  if (client) {
    const result = await client.connect({ chainIds: [chainId] });
    return { ...result, provider: client.getProvider() };
  }

  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("MetaMask is not available on this device.");
  }
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const rawChainId = (await provider.request({ method: "eth_chainId" })) as string;
  return { accounts, chainId: rawChainId, provider };
}

export async function disconnectLiveSession(): Promise<void> {
  const client = await getMetaMaskClient();
  if (!client) return;
  if (typeof client.disconnect === "function") {
    await client.disconnect();
    return;
  }
  if (typeof client.terminate === "function") {
    await client.terminate();
  }
}
