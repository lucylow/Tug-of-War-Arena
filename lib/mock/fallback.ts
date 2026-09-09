import { DemoModeManager, type MockFallbackReason } from "@/lib/mock/DemoModeManager";
import type { MockMatch, MockUser } from "@/lib/mock/generators";
import { DEFAULT_MOCK_SEED } from "@/lib/mock/seed";
import type { MockBlockchain } from "@/lib/mock/services/MockBlockchain";
import {
  isConfigurationError,
  isContractRevert,
  isPendingRequest,
  isSubmittedTransactionFailure,
  isUserRejected,
  shouldFallbackToDemo,
  toUserFacingError,
} from "@/lib/web3/errors";
import type { ArenaMatchView, ArenaPlayerStats, ArenaPlayerView } from "@/lib/web3/types";

export type { MockFallbackReason };

export const MOCK_FALLBACK_COPY = {
  badge: "DEMO DATA",
  kicker: "LOCAL FALLBACK",
  title: "Showing a seeded Friendzone world",
  body: "Live chain or API data is unavailable. Offline play and local receipts stay available.",
  matchHint: "Creates a local lobby receipt. Gameplay itself stays off-chain.",
} as const;

export type MockTxReceipt = {
  hash: string;
  mock: true;
  matchId: string;
  view?: ArenaMatchView;
};

function numericMatchId(match: MockMatch): number {
  const parsed = Number.parseInt(match.id.replace(/^match_/i, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function shouldUseMockFallback(error: unknown): boolean {
  if (
    isUserRejected(error) ||
    isContractRevert(error) ||
    isConfigurationError(error) ||
    isPendingRequest(error) ||
    isSubmittedTransactionFailure(error)
  ) {
    return false;
  }
  return shouldFallbackToDemo(error);
}

export function ensureMockBlockchain(seed: number = DEFAULT_MOCK_SEED): MockBlockchain {
  return DemoModeManager.getInstance().ensureEnabled(seed);
}

export function noteMockFallback(reason: MockFallbackReason): MockBlockchain {
  const manager = DemoModeManager.getInstance();
  manager.ensureEnabled();
  manager.setFallbackReason(reason);
  return manager.getOrCreateService();
}

export async function runLiveOrMock<T>(options: {
  enabled: boolean;
  live: () => Promise<T>;
  mock: (service: MockBlockchain) => Promise<T> | T;
  mockService?: MockBlockchain | null;
  reason?: MockFallbackReason;
  formatError?: boolean;
}): Promise<{ value: T; usedFallback: boolean }> {
  const reason = options.reason ?? "live-unavailable";
  const formatError = options.formatError ?? true;

  if (options.enabled) {
    try {
      return { value: await options.live(), usedFallback: false };
    } catch (error) {
      if (!shouldUseMockFallback(error)) {
        throw formatError ? toUserFacingError(error) : error;
      }
    }
  }

  const service = options.mockService ?? noteMockFallback(reason);
  return { value: await options.mock(service), usedFallback: true };
}

export async function withMockFallback<T>(
  live: () => Promise<T>,
  mock: () => Promise<T> | T,
  reason: MockFallbackReason = "request-failed",
): Promise<T> {
  const { value } = await runLiveOrMock({
    enabled: true,
    live,
    mock: () => mock(),
    reason,
    formatError: false,
  });
  return value;
}

export function toArenaMatchView(match: MockMatch): ArenaMatchView {
  const finished = match.winnerTeam != null;
  return {
    id: String(numericMatchId(match)),
    players: [...match.participants],
    startTime: String(Math.floor(match.startedAt.getTime() / 1000)),
    endTime: String(Math.floor(match.endedAt.getTime() / 1000)),
    status: finished ? 2 : 1,
    winner: match.winnerTeam === "blue" ? 1 : 0,
    prizePool: "20.0",
    sunPower: String(match.redScore),
    moonPower: String(match.blueScore),
  };
}

export function toArenaPlayerView(user: MockUser, team = 0, power = 0): ArenaPlayerView {
  return {
    wallet: user.id,
    displayName: user.displayName,
    team,
    power: String(power),
    isReady: true,
  };
}

export function toArenaPlayerStats(user: MockUser): ArenaPlayerStats {
  return {
    elo: String(1000 + user.wins * 12 - user.losses * 4),
    displayName: user.displayName,
    team: user.faction === "blue" ? 1 : 0,
    power: String(user.wins * 3),
    isReady: true,
  };
}

export function mockMatchReceipt(match: MockMatch): MockTxReceipt {
  return {
    hash: `demo_${match.id}`,
    mock: true,
    matchId: match.id,
  };
}

export function findMockMatch(matches: MockMatch[], matchId: number | string): MockMatch | null {
  const needle = String(matchId);
  return (
    matches.find((match) => match.id === needle || match.id === `match_${needle}` || String(numericMatchId(match)) === needle) ??
    null
  );
}

export function requireMockMatch(matches: MockMatch[], matchId: number | string): MockMatch {
  const match = findMockMatch(matches, matchId);
  if (!match) throw new Error("Match not found");
  return match;
}
