import { useCallback, useState } from "react";

import { useBlockchain } from "@/hooks/use-blockchain";
import { useContract } from "@/hooks/use-contract";
import {
  mockMatchReceipt,
  requireMockMatch,
  runLiveOrMock,
  toArenaMatchView,
  toArenaPlayerStats,
  toArenaPlayerView,
  type MockFallbackReason,
} from "@/lib/mock/fallback";
import type { MockBlockchain } from "@/lib/mock/services/MockBlockchain";
import { TUG_OF_WAR_ARENA_ABI } from "@/lib/web3/abi";
import { FZONE_ENTRY_FEE, isLiveContractAddress } from "@/lib/web3/addresses";
import { requireLiveContracts, resolveLiveContracts } from "@/lib/web3/live";
import { decodeMatchCreated, decodeMatchView, decodePlayerInMatch, decodePlayerStats } from "@/lib/web3/match";
import { ensureTokenAllowance } from "@/lib/web3/token";
import type { ArenaMatchView, ArenaPlayerStats, ArenaPlayerView, ArenaTxResult } from "@/lib/web3/types";

type TxReceiptLike = { hash?: string; logs?: { topics: readonly string[]; data: string }[] };

function gameFallbackReason(gameAddress: string): MockFallbackReason {
  return isLiveContractAddress(gameAddress) ? "live-unavailable" : "unconfigured-contract";
}

async function createLocalMatch(mock: MockBlockchain, account: string | null): Promise<ArenaTxResult> {
  let opponent = "user_1";
  try {
    opponent = (await mock.getAllUsers())[1]?.id ?? "user_1";
  } catch {
    opponent = "user_1";
  }
  const match = await mock.createMatch([account ?? "user_0", opponent]);
  const view = toArenaMatchView(match);
  return { ...mockMatchReceipt(match), view, matchId: view.id };
}

export function useGameContract() {
  const {
    isConnected,
    connectionMode,
    ensureCorrectNetwork,
    mockService,
    account,
    chainId,
    signer,
    refreshBalance,
  } = useBlockchain();
  const live = resolveLiveContracts({ isConnected, connectionMode, chainId });
  const { call, callSilent, send, loading, error } = useContract(live.gameAddress, TUG_OF_WAR_ARENA_ABI);
  const [usingFallback, setUsingFallback] = useState(!live.canUseLiveGame);
  const [phase, setPhase] = useState<"idle" | "approving" | "submitting">("idle");

  const requireLiveWallet = useCallback(
    () =>
      requireLiveContracts(
        { isConnected, connectionMode, ensureNetwork: ensureCorrectNetwork },
        { game: true, token: true },
      ),
    [connectionMode, ensureCorrectNetwork, isConnected],
  );

  const run = useCallback(
    async <T>(
      enabled: boolean,
      liveFn: () => Promise<T>,
      mockFn: (service: MockBlockchain) => Promise<T> | T,
      reason: MockFallbackReason = "live-unavailable",
    ) => {
      const result = await runLiveOrMock({
        enabled,
        live: liveFn,
        mock: mockFn,
        mockService,
        reason,
      });
      setUsingFallback(result.usedFallback);
      return result.value;
    },
    [mockService],
  );

  const approveAndSend = useCallback(
    async (method: "createMatch" | "joinMatch", ...args: unknown[]): Promise<ArenaTxResult> => {
      try {
        const next = await requireLiveWallet();
        if (!signer) throw new Error("Connect MetaMask to use on-chain matches.");
        setPhase("approving");
        const approval = await ensureTokenAllowance({
          signer,
          tokenAddress: next.tokenAddress,
          spender: next.gameAddress,
          amount: FZONE_ENTRY_FEE,
        });
        setPhase("submitting");
        const receipt = (await send(method, ...args)) as TxReceiptLike;
        const created = decodeMatchCreated(receipt);
        const matchId = created?.matchId || String(args[0] ?? "");
        let view: ArenaMatchView | undefined;
        if (matchId) {
          try {
            view = decodeMatchView(await callSilent<unknown>("getMatch", Number(matchId)));
          } catch {
            view = undefined;
          }
        }
        try {
          void refreshBalance?.();
        } catch {
          // Match creation still succeeded if the balance refresh fails.
        }
        return {
          hash: created?.hash || receipt?.hash || "",
          matchId,
          view,
          approved: !approval.alreadyApproved,
        };
      } finally {
        setPhase("idle");
      }
    },
    [callSilent, refreshBalance, requireLiveWallet, send, signer],
  );

  const createMatch = useCallback(
    async (displayName = "CrewLead"): Promise<ArenaTxResult> =>
      run(
        Boolean(isConnected && connectionMode === "live"),
        () => approveAndSend("createMatch", displayName),
        (mock) => createLocalMatch(mock, account),
        gameFallbackReason(live.gameAddress),
      ),
    [account, approveAndSend, connectionMode, isConnected, live.gameAddress, run],
  );

  const joinMatch = useCallback(
    async (matchId: number, displayName = "Crewmate"): Promise<ArenaTxResult> =>
      run(
        Boolean(isConnected && connectionMode === "live"),
        () => approveAndSend("joinMatch", matchId, displayName),
        async (mock) => {
          const match = requireMockMatch(await mock.getMatches(), matchId);
          const view = toArenaMatchView(match);
          return { ...mockMatchReceipt(match), view, matchId: view.id };
        },
      ),
    [approveAndSend, connectionMode, isConnected, run],
  );

  const getMatch = useCallback(
    async (matchId: number): Promise<ArenaMatchView> =>
      run(
        live.canUseLiveGame,
        async () => {
          await requireLiveWallet();
          return decodeMatchView(await call<unknown>("getMatch", matchId));
        },
        async (mock) => toArenaMatchView(requireMockMatch(await mock.getMatches(), matchId)),
      ),
    [call, live.canUseLiveGame, requireLiveWallet, run],
  );

  const getMatchCounter = useCallback(
    async () =>
      run(
        live.canUseLiveGame,
        async () => {
          await requireLiveWallet();
          return String(await call<unknown>("nextMatchId"));
        },
        async (mock) => String((await mock.getMatches()).length),
      ),
    [call, live.canUseLiveGame, requireLiveWallet, run],
  );

  const startMatch = useCallback(
    async (matchId: number): Promise<ArenaTxResult> =>
      run(
        live.canUseLiveGame,
        async () => {
          const receipt = (await send("startMatch", matchId)) as { hash?: string };
          return { hash: receipt?.hash ?? "", matchId: String(matchId) };
        },
        async (mock) => mockMatchReceipt(requireMockMatch(await mock.getMatches(), matchId)),
      ),
    [live.canUseLiveGame, run, send],
  );

  const leaveMatch = useCallback(
    async (matchId: number): Promise<ArenaTxResult> =>
      run(live.canUseLiveGame, async () => {
        const receipt = (await send("leaveMatch", matchId)) as { hash?: string };
        return { hash: receipt?.hash ?? "", matchId: String(matchId) };
      }, () => ({ hash: `demo_leave_${matchId}`, mock: true, matchId: String(matchId) })),
    [live.canUseLiveGame, run, send],
  );

  const updatePower = useCallback(
    async (matchId: number, _player: string, power: number): Promise<ArenaTxResult> => {
      if (live.canUseLiveGame) {
        throw new Error("Pull checkpoints are submitted by the match operator, not the player wallet.");
      }
      setUsingFallback(true);
      return { hash: `demo_power_${matchId}_${power}`, mock: true, matchId: String(matchId) };
    },
    [live.canUseLiveGame],
  );

  const getPlayerInMatch = useCallback(
    async (matchId: number, player?: string): Promise<ArenaPlayerView> =>
      run(
        live.canUseLiveGame,
        async () => {
          const target = player || account;
          if (!target) throw new Error("No address provided");
          return decodePlayerInMatch(await call<unknown>("getPlayerInMatch", matchId, target));
        },
        async (mock) => toArenaPlayerView(await mock.getCurrentUser()),
      ),
    [account, call, live.canUseLiveGame, run],
  );

  const getPlayerStats = useCallback(
    async (matchId?: number, address?: string): Promise<ArenaPlayerStats> =>
      run(
        live.canUseLiveGame,
        async () => {
          const target = address || account;
          if (!target) throw new Error("No address provided");
          const elo = await call<unknown>("playerElo", target);
          const player = matchId != null ? await getPlayerInMatch(matchId, target) : null;
          return decodePlayerStats(elo, player);
        },
        async (mock) => toArenaPlayerStats(await mock.getCurrentUser()),
      ),
    [account, call, getPlayerInMatch, live.canUseLiveGame, run],
  );

  return {
    createMatch,
    joinMatch,
    getMatch,
    getMatchCounter,
    startMatch,
    leaveMatch,
    updatePower,
    getPlayerInMatch,
    getPlayerStats,
    call,
    send,
    loading: loading || phase !== "idle",
    phase,
    error,
    isConnected,
    isLive: live.canUseLiveGame && !usingFallback,
    usingFallback,
    contractAddress: live.gameAddress,
    tokenAddress: live.tokenAddress,
  };
}
