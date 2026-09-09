import { useCallback } from "react";

import { useBlockchain } from "@/hooks/use-blockchain";
import { useContract } from "@/hooks/use-contract";
import { GAME_ABI } from "@/lib/web3/abi";
import { DEFAULT_CHAIN_ID, getGameContractAddress } from "@/lib/web3/config";
import { decodeMatchView } from "@/lib/web3/match";
import type { ArenaMatchView } from "@/lib/web3/types";

const GAME_ADDRESS = getGameContractAddress();

export function useGameContract() {
  const { isConnected, connectionMode, ensureCorrectNetwork } = useBlockchain();
  const { call, send, loading, error } = useContract(GAME_ADDRESS, GAME_ABI);

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

  const getMatch = useCallback(
    async (matchId: number): Promise<ArenaMatchView> => {
      await requireLiveWallet();
      const data = await call<unknown>("getMatch", matchId);
      return decodeMatchView(data);
    },
    [call, requireLiveWallet],
  );

  const getMatchCounter = useCallback(async () => {
    await requireLiveWallet();
    const counter = await call<unknown>("nextMatchId");
    return String(counter);
  }, [call, requireLiveWallet]);

  return {
    createMatch,
    joinMatch,
    getMatch,
    getMatchCounter,
    loading,
    error,
    isConnected,
    isLive: connectionMode === "live",
    contractAddress: GAME_ADDRESS,
  };
}
