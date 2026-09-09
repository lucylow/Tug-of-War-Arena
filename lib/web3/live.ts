import { isLiveContractAddress } from "@/lib/web3/addresses";
import {
  DEFAULT_CHAIN_ID,
  getGameContractAddress,
  getNftContractAddress,
  getSocialReputationAddress,
  getTokenContractAddress,
  isSupportedChainId,
} from "@/lib/web3/config";
import type { ConnectionMode } from "@/lib/web3/types";

export type LiveContractContext = {
  chainId: number;
  gameAddress: string;
  tokenAddress: string;
  nftAddress: string;
  reputationAddress: string;
  isLiveWallet: boolean;
  isSupportedNetwork: boolean;
  canUseLiveGame: boolean;
  canUseLiveReputation: boolean;
};

export async function requireLiveContracts(
  session: {
    isConnected: boolean;
    connectionMode: ConnectionMode | null;
    ensureNetwork: (chainId?: number) => Promise<void>;
  },
  needs: { game?: boolean; token?: boolean; reputation?: boolean },
): Promise<LiveContractContext> {
  const reputationOnly = Boolean(needs.reputation && !needs.game && !needs.token);
  if (!session.isConnected || session.connectionMode !== "live") {
    throw new Error(
      reputationOnly ? "Connect MetaMask to use on-chain reputation." : "Connect MetaMask to use on-chain matches.",
    );
  }
  await session.ensureNetwork(DEFAULT_CHAIN_ID);
  const live = resolveLiveContracts({
    isConnected: true,
    connectionMode: "live",
    chainId: DEFAULT_CHAIN_ID,
  });
  if (needs.game && !isLiveContractAddress(live.gameAddress)) {
    throw new Error("Game contract address is not configured for this network.");
  }
  if (needs.token && !isLiveContractAddress(live.tokenAddress)) {
    throw new Error("FZONE token address is not configured for this network.");
  }
  if (needs.reputation && !isLiveContractAddress(live.reputationAddress)) {
    throw new Error("Social reputation contract is not configured.");
  }
  return live;
}

export function resolveLiveContracts(options: {
  isConnected: boolean;
  connectionMode: ConnectionMode | null;
  chainId: number | null | undefined;
}): LiveContractContext {
  const chainId = options.chainId && options.chainId > 0 ? options.chainId : DEFAULT_CHAIN_ID;
  const gameAddress = getGameContractAddress(chainId);
  const tokenAddress = getTokenContractAddress(chainId);
  const nftAddress = getNftContractAddress(chainId);
  const reputationAddress = getSocialReputationAddress(chainId);
  const isLiveWallet = options.isConnected && options.connectionMode === "live";
  return {
    chainId,
    gameAddress,
    tokenAddress,
    nftAddress,
    reputationAddress,
    isLiveWallet,
    isSupportedNetwork: isSupportedChainId(options.chainId),
    canUseLiveGame: isLiveWallet && isLiveContractAddress(gameAddress) && isLiveContractAddress(tokenAddress),
    canUseLiveReputation: isLiveWallet && isLiveContractAddress(reputationAddress),
  };
}
