export type Team = "sun" | "moon";
export type MatchOrigin = "demo" | "live";

export interface WorldMatchResult {
  id: string;
  roomId: string;
  winner: Team;
  playerTeam: Team;
  playerPulls: number;
  opponentPulls: number;
  durationMs: number;
  streak: number;
  personalBest: boolean;
  origin: MatchOrigin;
}

export function createWorldMatchResult(
  partial: Partial<WorldMatchResult> & Pick<WorldMatchResult, "id" | "roomId" | "winner" | "playerTeam">,
): WorldMatchResult {
  const playerPulls = Number.isFinite(partial.playerPulls) ? Math.max(0, Math.floor(partial.playerPulls!)) : 0;
  const opponentPulls = Number.isFinite(partial.opponentPulls)
    ? Math.max(0, Math.floor(partial.opponentPulls!))
    : 0;
  return {
    id: partial.id,
    roomId: partial.roomId,
    winner: partial.winner,
    playerTeam: partial.playerTeam,
    playerPulls,
    opponentPulls,
    durationMs: Number.isFinite(partial.durationMs) ? Math.max(0, Math.floor(partial.durationMs!)) : 0,
    streak: Number.isFinite(partial.streak) ? Math.max(0, Math.floor(partial.streak!)) : 0,
    personalBest: Boolean(partial.personalBest),
    origin: partial.origin === "live" ? "live" : "demo",
  };
}

export function playerWon(result: WorldMatchResult): boolean {
  return result.winner === result.playerTeam;
}

export function formatMatchScore(result: WorldMatchResult): string {
  const sun = result.playerTeam === "sun" ? result.playerPulls : result.opponentPulls;
  const moon = result.playerTeam === "moon" ? result.playerPulls : result.opponentPulls;
  return `${sun} vs ${moon}`;
}
