import { ethers, type InterfaceAbi } from "ethers";

import { DEFAULT_CHAIN_ID, NETWORKS, getDefaultNetwork } from "@/lib/web3/config";

const providers = new Map<number, ethers.JsonRpcProvider>();
const RPC_TIMEOUT_MS = 12_000;

export function getReadProvider(chainId: number = DEFAULT_CHAIN_ID): ethers.JsonRpcProvider {
  const network = NETWORKS[chainId] ?? getDefaultNetwork();
  const existing = providers.get(network.chainId);
  if (existing) return existing;
  const rpcUrl = network.rpcUrls[0];
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for chain ${network.chainId}.`);
  }
  const request = new ethers.FetchRequest(rpcUrl);
  request.timeout = RPC_TIMEOUT_MS;
  const provider = new ethers.JsonRpcProvider(request, network.chainId, { staticNetwork: true });
  providers.set(network.chainId, provider);
  return provider;
}

export function getReadContract(address: string, abi: InterfaceAbi, chainId: number = DEFAULT_CHAIN_ID): ethers.Contract {
  if (!address) throw new Error("Contract address is not configured.");
  return new ethers.Contract(address, abi, getReadProvider(chainId));
}

export function resetReadProvidersForTests(): void {
  providers.clear();
}
