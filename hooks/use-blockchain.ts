import { useCallback, useEffect, useMemo, useState } from "react";

import { DemoModeManager } from "@/lib/mock/DemoModeManager";
import type { MockBlockchain } from "@/lib/mock/services/MockBlockchain";
import { DEFAULT_CHAIN_ID } from "@/lib/web3/config";
import { formatAddress, getNetworkName } from "@/lib/web3/format";
import { useWallet } from "@/lib/web3/MetaMaskProvider";
import { DEMO_ACCOUNT } from "@/lib/web3/session";

function toMockActor(account: string | null): string {
  if (!account) return "user_0";
  if (account.toLowerCase() === DEMO_ACCOUNT.toLowerCase()) return "user_0";
  return account;
}

export function useBlockchain() {
  const wallet = useWallet();
  const [, setGeneration] = useState(0);

  useEffect(() => DemoModeManager.getInstance().subscribe(() => setGeneration((value) => value + 1)), []);

  const manager = DemoModeManager.getInstance();
  const isMock = manager.isActive() || wallet.connectionMode === "demo";
  const mockService: MockBlockchain | null = isMock ? manager.getOrCreateService() : null;
  const actorId = toMockActor(wallet.account);

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

  const getCurrentUser = useCallback(async () => {
    if (!mockService) return null;
    return mockService.getCurrentUser();
  }, [mockService]);

  const getUser = useCallback(
    async (id: string) => {
      if (!mockService) return null;
      return mockService.getUser(id);
    },
    [mockService],
  );

  const getAllUsers = useCallback(async () => {
    if (!mockService) return [];
    return mockService.getAllUsers();
  }, [mockService]);

  const getNFTs = useCallback(
    async (ownerId?: string) => {
      if (!mockService) return [];
      return mockService.getNFTs(ownerId);
    },
    [mockService],
  );

  const getNFT = useCallback(
    async (id: number) => {
      if (!mockService) return null;
      return mockService.getNFT(id);
    },
    [mockService],
  );

  const getMatches = useCallback(async () => {
    if (!mockService) return [];
    return mockService.getMatches();
  }, [mockService]);

  const getLeaderboard = useCallback(async () => {
    if (!mockService) return [];
    return mockService.getLeaderboard();
  }, [mockService]);

  const getQuests = useCallback(async () => {
    if (!mockService) return [];
    return mockService.getQuests();
  }, [mockService]);

  const getGuilds = useCallback(async () => {
    if (!mockService) return [];
    return mockService.getGuilds();
  }, [mockService]);

  const getFactions = useCallback(async () => {
    if (!mockService) return [];
    return mockService.getFactions();
  }, [mockService]);

  const getPredictions = useCallback(async () => {
    if (!mockService) return [];
    return mockService.getPredictions();
  }, [mockService]);

  const getAchievements = useCallback(async () => {
    if (!mockService) return [];
    return mockService.getAchievements();
  }, [mockService]);

  const getStakePositions = useCallback(
    async (userId?: string) => {
      if (!mockService) return [];
      return mockService.getStakePositions(userId ?? actorId);
    },
    [actorId, mockService],
  );

  const mintNFT = useCallback(
    async (rarity: string) => {
      if (!mockService) return null;
      return mockService.mintNFT(actorId, rarity);
    },
    [actorId, mockService],
  );

  const stakeNFT = useCallback(
    async (id: number) => {
      if (!mockService) return;
      await mockService.stakeNFT(id, actorId);
    },
    [actorId, mockService],
  );

  const unstakeNFT = useCallback(
    async (id: number) => {
      if (!mockService) return;
      await mockService.unstakeNFT(id, actorId);
    },
    [actorId, mockService],
  );

  const createMatch = useCallback(
    async (playerIds: string[]) => {
      if (!mockService) return null;
      return mockService.createMatch(playerIds);
    },
    [mockService],
  );

  const joinGuild = useCallback(
    async (guildId: string) => {
      if (!mockService) return;
      await mockService.joinGuild(guildId, actorId);
    },
    [actorId, mockService],
  );

  const acceptQuest = useCallback(
    async (questId: string) => {
      if (!mockService) return;
      await mockService.acceptQuest(questId, actorId);
    },
    [actorId, mockService],
  );

  const claimQuest = useCallback(
    async (questId: string) => {
      if (!mockService) return;
      await mockService.claimQuest(questId, actorId);
    },
    [actorId, mockService],
  );

  const getTokenBalance = useCallback(async () => {
    if (mockService) return mockService.getBalance(actorId);
    return Number.parseFloat(wallet.balance || "0") || 0;
  }, [actorId, mockService, wallet.balance]);

  const transferTokens = useCallback(
    async (to: string, amount: number) => {
      if (!mockService) return;
      await mockService.transferTokens(actorId, to, amount);
    },
    [actorId, mockService],
  );

  const manaBalance = useMemo(() => {
    if (!isMock) return null;
    return wallet.balance ?? "0";
  }, [isMock, wallet.balance]);

  return {
    ...wallet,
    isMock,
    mockService,
    nftContract: mockService?.nft ?? null,
    tokenContract: mockService?.token ?? null,
    socialContract: mockService?.social ?? null,
    manaBalance,
    formatAddress,
    getNetworkName: () => getNetworkName(wallet.chainId),
    isCorrectNetwork,
    ensureCorrectNetwork,
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
