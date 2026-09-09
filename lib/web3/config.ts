import { getFriendzoneAddresses, isContractsConfigured } from "@/lib/web3/addresses";

export const DAPP_METADATA = {
  name: "Tug of War Arena",
  url: "https://tugofwar.example.com",
  description: "Multiplayer Tug of War Game for Decentraland",
  iconUrl: "https://tugofwar.example.com/icon.png",
} as const;

export type NetworkDefinition = {
  chainId: number;
  hexChainId: `0x${string}`;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

export const NETWORKS: Record<number, NetworkDefinition> = {
  1: {
    chainId: 1,
    hexChainId: "0x1",
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: [process.env.EXPO_PUBLIC_ETHEREUM_RPC ?? "https://cloudflare-eth.com"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  137: {
    chainId: 137,
    hexChainId: "0x89",
    name: "Polygon",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: [process.env.EXPO_PUBLIC_POLYGON_RPC ?? "https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
  80002: {
    chainId: 80002,
    hexChainId: "0x13882",
    name: "Polygon Amoy",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: [process.env.EXPO_PUBLIC_AMOY_RPC ?? "https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://amoy.polygonscan.com"],
  },
};

export const SUPPORTED_NETWORKS = [NETWORKS[80002], NETWORKS[137], NETWORKS[1]].filter(
  (network): network is NetworkDefinition => Boolean(network),
);

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULT_CHAIN_ID = readPositiveInt(process.env.EXPO_PUBLIC_DEFAULT_CHAIN_ID, 80002);

export function getDefaultNetwork(): NetworkDefinition {
  return NETWORKS[DEFAULT_CHAIN_ID] ?? NETWORKS[80002] ?? NETWORKS[137] ?? NETWORKS[1]!;
}

export function getGameContractAddress(chainId: number = DEFAULT_CHAIN_ID): string {
  const fromEnv = process.env.EXPO_PUBLIC_GAME_CONTRACT?.trim() ?? "";
  if (/^0x[a-fA-F0-9]{40}$/.test(fromEnv) && !/^0x0{40}$/i.test(fromEnv)) return fromEnv;
  const addresses = getFriendzoneAddresses(chainId);
  return isContractsConfigured(addresses) ? addresses.TugOfWarArena : "";
}

export function getSocialReputationAddress(chainId: number = DEFAULT_CHAIN_ID): string {
  const fromEnv = process.env.EXPO_PUBLIC_REPUTATION_CONTRACT?.trim() ?? "";
  if (/^0x[a-fA-F0-9]{40}$/.test(fromEnv) && !/^0x0{40}$/i.test(fromEnv)) return fromEnv;
  const addresses = getFriendzoneAddresses(chainId);
  return addresses.SocialReputation !== "0x0000000000000000000000000000000000000000" ? addresses.SocialReputation : "";
}

export function getSupportedNetworkMap(): Record<`0x${string}`, string> {
  const map: Record<string, string> = {};
  for (const network of Object.values(NETWORKS)) {
    const rpc = network.rpcUrls[0];
    if (rpc) map[network.hexChainId] = rpc;
  }
  return map as Record<`0x${string}`, string>;
}

export function addChainParams(chainId: number) {
  const network = NETWORKS[chainId];
  if (!network) return null;
  return {
    chainId: network.hexChainId,
    chainName: network.name,
    nativeCurrency: network.nativeCurrency,
    rpcUrls: network.rpcUrls,
    blockExplorerUrls: network.blockExplorerUrls,
  };
}

export const WALLET_ACCOUNT_STORAGE_KEY = "tug-of-war-metamask-account";
export const MOBILE_WALLET_SCHEMES = ["metamask", "wc"] as const;
export const DEFAULT_HEX_CHAIN_ID = `0x${DEFAULT_CHAIN_ID.toString(16)}` as `0x${string}`;
