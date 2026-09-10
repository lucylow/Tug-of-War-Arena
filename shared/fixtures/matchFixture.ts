import { createWorldMatchResult, type WorldMatchResult } from "../match";

export const matchFixture: WorldMatchResult = createWorldMatchResult({
  id: "match_001",
  roomId: "room_friday",
  winner: "sun",
  playerTeam: "sun",
  playerPulls: 428,
  opponentPulls: 381,
  durationMs: 42_000,
  streak: 4,
  personalBest: true,
  origin: "demo",
});
