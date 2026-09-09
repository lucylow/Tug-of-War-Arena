import { useCallback } from "react";

import { useBlockchain } from "@/hooks/use-blockchain";
import { useContract } from "@/hooks/use-contract";
import { TUG_OF_WAR_ARENA_ABI } from "@/lib/web3/abi";
import { DEFAULT_CHAIN_ID, getGameContractAddress } from "@/lib/web3/config";
import { decodeMatchView, decodePlayerInMatch, decodePlayerStats } from "@/lib/web3/match";
import type { ArenaMatchView, ArenaPlayerStats, ArenaPlayerView } from "@/lib/web3/types";

const GAME_ADDRESS = getGameContractAddress();

/**
 * On-chain lobby + settlement helpers for multiplayer matches.
 * High-frequency pulls stay on the SyncManager; this hook is the mint/settle boundary.
 */
export function useMultiplayerContract() {
  const { isConnected, connectionMode, account, ensureCorrectNetwork } = useBlockchain();
  const { call, send, loading, error } = useContract(GAME_ADDRESS, TUG_OF_WAR_ARENA_ABI);

  const requireLiveWallet = useCallback(async () => {
    if (!isConnected || connectionMode !== "live") {
      throw new Error("Connect MetaMask to use on-chain matches.");
    }
    if (!GAME_ADDRESS) {
      throw new Error("Game contract address is not configured.");
    }
    await ensureCorrectNetwork(DEFAULT_CHAIN_ID);
  }, [connectionMode, ensureCorrectNetwork, isConnected]);

  const createMatch = useCallback(
    async (displayName = "CrewLead") => {
      await requireLiveWallet();
      return send("createMatch", displayName);
    },
    [requireLiveWallet, send],
  );

  const joinMatch = useCallback(
    async (matchId: number, displayName = "Crewmate") => {
      await requireLiveWallet();
      return send("joinMatch", matchId, displayName);
    },
    [requireLiveWallet, send],
  );

  const startMatch = useCallback(
    async (matchId: number) => {
      await requireLiveWallet();
      return send("startMatch", matchId);
    },
    [requireLiveWallet, send],
  );

  const leaveMatch = useCallback(
    async (matchId: number) => {
      await requireLiveWallet();
      return send("leaveMatch", matchId);
    },
    [requireLiveWallet, send],
  );

  const updatePower = useCallback(
    async (matchId: number, player: string, power: number) => {
      await requireLiveWallet();
      return send("updatePower", matchId, player, power);
    },
    [requireLiveWallet, send],
  );

  const getMatch = useCallback(
    async (matchId: number): Promise<ArenaMatchView> => {
      await requireLiveWallet();
      const data = await call<unknown>("getMatch", matchId);
      return decodeMatchView(data);
    },
    [call, requireLiveWallet],
  );

  const getPlayerInMatch = useCallback(
    async (matchId: number, player?: string): Promise<ArenaPlayerView> => {
      await requireLiveWallet();
      const target = player || account;
      if (!target) throw new Error("No address provided");
      const data = await call<unknown>("getPlayerInMatch", matchId, target);
      return decodePlayerInMatch(data);
    },
    [account, call, requireLiveWallet],
  );

  const getPlayerStats = useCallback(
    async (matchId?: number, address?: string): Promise<ArenaPlayerStats> => {
      await requireLiveWallet();
      const target = address || account;
      if (!target) throw new Error("No address provided");
      const elo = await call<unknown>("playerElo", target);
      const player = matchId != null ? await getPlayerInMatch(matchId, target) : null;
      return decodePlayerStats(elo, player);
    },
    [account, call, getPlayerInMatch, requireLiveWallet],
  );

  const getMatchCounter = useCallback(async () => {
    await requireLiveWallet();
    const counter = await call<unknown>("nextMatchId");
    return String(counter);
  }, [call, requireLiveWallet]);

  return {
    createMatch,
    joinMatch,
    startMatch,
    leaveMatch,
    updatePower,
    getMatch,
    getPlayerInMatch,
    getPlayerStats,
    getMatchCounter,
    loading,
    error,
    isConnected,
    isLive: connectionMode === "live",
    contractAddress: GAME_ADDRESS,
  };
}
