import { MAX_QUESTS, MAX_RECENT_MATCHES } from "./constants";
import type { HybridWorldDataset, MobileWorldProjection } from "./types";

export function projectWorldToMobile2D(dataset: HybridWorldDataset): MobileWorldProjection {
  return {
    heroRoom: dataset.rooms.find((room) => room.featured) ?? dataset.rooms[0] ?? null,
    nearbyPlayers: dataset.players.filter((player) => player.presence !== "offline").slice(0, 8),
    upcomingEvents: dataset.events.slice(0, 4),
    missions: dataset.missions.slice(0, MAX_QUESTS).slice(0, 4),
    recentMatches: dataset.matches.slice(0, MAX_RECENT_MATCHES),
    socialSignals: dataset.socialSignals.slice(0, 8),
    portals: dataset.portals,
    scoreboard: dataset.scoreboard,
    metrics: dataset.metrics,
    generatedAt: dataset.generatedAt,
    mode: dataset.mode,
  };
}
