import { useCallback, useMemo } from "react";

import { useDemoModeTick } from "@/hooks/use-demo-mode";
import { DemoModeManager } from "@/lib/mock/DemoModeManager";
import type { MockBlockchain } from "@/lib/mock/services/MockBlockchain";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import { formatAddress, getNetworkName } from "@/lib/web3/format";
import { resolveLiveContracts } from "@/lib/web3/live";
import { useWallet } from "@/lib/web3/MetaMaskProvider";
import { isDemoAccount } from "@/lib/web3/session";

function toMockActor(account: string | null): string {
  if (!account) return "user_0";
  if (isDemoAccount(account)) return "user_0";
  return account;
}

export function useBlockchain() {
  const wallet = useWallet();
  useDemoModeTick();

  const manager = DemoModeManager.getInstance();
  const isLiveWallet = wallet.connectionMode === "live";
  const isMock = !isLiveWallet;
  const mockService: MockBlockchain | null = manager.getOrCreateService();
  const actorId = toMockActor(wallet.account);
  const live = resolveLiveContracts({
    isConnected: wallet.isConnected,
    connectionMode: wallet.connectionMode,
    chainId: wallet.chainId,
  });

  const isCorrectNetwork = useCallback(
    (targetChainId: number) => wallet.chainId === targetChainId,
    [wallet.chainId],
  );

  const ensureCorrectNetwork = useCallback(
    async (targetChainId: number = DEFAULT_CHAIN_ID) => {
      if (wallet.chainId !== targetChainId) {
        await wallet.switchNetwork(targetChainId);
      }
    },
    [wallet],
  );

  const getCurrentUser = useCallback(async () => (mockService ? mockService.getCurrentUser() : null), [mockService]);
  const getUser = useCallback(async (id: string) => (mockService ? mockService.getUser(id) : null), [mockService]);
  const getAllUsers = useCallback(async () => (mockService ? mockService.getAllUsers() : []), [mockService]);
  const getNFTs = useCallback(async (ownerId?: string) => (mockService ? mockService.getNFTs(ownerId) : []), [mockService]);
  const getNFT = useCallback(async (id: number) => (mockService ? mockService.getNFT(id) : null), [mockService]);
  const getMatches = useCallback(async () => (mockService ? mockService.getMatches() : []), [mockService]);
  const getLeaderboard = useCallback(async () => (mockService ? mockService.getLeaderboard() : []), [mockService]);
  const getQuests = useCallback(async () => (mockService ? mockService.getQuests() : []), [mockService]);
  const getGuilds = useCallback(async () => (mockService ? mockService.getGuilds() : []), [mockService]);
  const getFactions = useCallback(async () => (mockService ? mockService.getFactions() : []), [mockService]);
  const getPredictions = useCallback(async () => (mockService ? mockService.getPredictions() : []), [mockService]);
  const getAchievements = useCallback(async () => (mockService ? mockService.getAchievements() : []), [mockService]);
  const getStakePositions = useCallback(
    async (userId?: string) => (mockService ? mockService.getStakePositions(userId ?? actorId) : []),
    [actorId, mockService],
  );
  const mintNFT = useCallback(async (rarity: string) => (mockService ? mockService.mintNFT(actorId, rarity) : null), [actorId, mockService]);
  const stakeNFT = useCallback(async (id: number) => {
    if (mockService) await mockService.stakeNFT(id, actorId);
  }, [actorId, mockService]);
  const unstakeNFT = useCallback(async (id: number) => {
    if (mockService) await mockService.unstakeNFT(id, actorId);
  }, [actorId, mockService]);
  const createMatch = useCallback(async (playerIds: string[]) => (mockService ? mockService.createMatch(playerIds) : null), [mockService]);
  const joinGuild = useCallback(async (guildId: string) => {
    if (mockService) await mockService.joinGuild(guildId, actorId);
  }, [actorId, mockService]);
  const acceptQuest = useCallback(async (questId: string) => {
    if (mockService) await mockService.acceptQuest(questId, actorId);
  }, [actorId, mockService]);
  const claimQuest = useCallback(async (questId: string) => {
    if (mockService) await mockService.claimQuest(questId, actorId);
  }, [actorId, mockService]);
  const getTokenBalance = useCallback(async () => {
    if (!isLiveWallet && mockService) return mockService.getBalance(actorId);
    return Number.parseFloat(wallet.balance || "0") || 0;
  }, [actorId, isLiveWallet, mockService, wallet.balance]);
  const transferTokens = useCallback(async (to: string, amount: number) => {
    if (mockService) await mockService.transferTokens(actorId, to, amount);
  }, [actorId, mockService]);

  const manaBalance = useMemo(() => wallet.balance ?? "0", [wallet.balance]);

  return {
    ...wallet,
    isMock,
    isLiveWallet,
    mockService,
    nftContract: mockService?.nft ?? null,
    tokenContract: mockService?.token ?? null,
    socialContract: mockService?.social ?? null,
    manaBalance,
    fallbackReason: manager.getFallbackReason(),
    formatAddress,
    getNetworkName: () => getNetworkName(wallet.chainId),
    isCorrectNetwork,
    ensureCorrectNetwork,
    gameAddress: live.gameAddress,
    tokenAddress: live.tokenAddress,
    canUseLiveGame: live.canUseLiveGame,
    isSupportedNetwork: live.isSupportedNetwork,
    getCurrentUser,
    getUser,
    getAllUsers,
    getNFTs,
    getNFT,
    getMatches,
    getLeaderboard,
    getQuests,
    getGuilds,
    getFactions,
    getPredictions,
    getAchievements,
    getStakePositions,
    mintNFT,
    stakeNFT,
    unstakeNFT,
    createMatch,
    joinGuild,
    acceptQuest,
    claimQuest,
    getBalance: getTokenBalance,
    transferTokens,
  };
}
