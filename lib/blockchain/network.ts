import {
  DEFAULT_CHAIN_ID,
  NETWORKS,
  getDefaultNetwork,
  getExplorerBaseUrl,
  isSupportedChainId,
  type NetworkDefinition,
} from "@/lib/web3/config";

export const CHAIN_ID = DEFAULT_CHAIN_ID;
export const DECENTRALAND_NETWORK = getDefaultNetwork();
export const EXPLORER_URL = getExplorerBaseUrl(CHAIN_ID) ?? "https://amoy.polygonscan.com";

export function getChainConfig(chainId: number = CHAIN_ID): NetworkDefinition {
  return NETWORKS[chainId] ?? DECENTRALAND_NETWORK;
}

export function formatChainId(chainId: number | null | undefined): string {
  if (chainId == null || !Number.isFinite(chainId)) return "unknown";
  return `0x${chainId.toString(16)}`;
}

export function assertSupportedChain(chainId: number | null | undefined): asserts chainId is number {
  if (!isSupportedChainId(chainId)) {
    throw Object.assign(new Error("This network is not supported for Friendzone rewards."), {
      code: 4902,
    });
  }
}

export function isWrongNetwork(chainId: number | null | undefined): boolean {
  return chainId != null && !isSupportedChainId(chainId);
}
