import { MAX_QUESTS, MAX_RECENT_MATCHES } from "./constants";
import { createFallbackHybridWorldDataset, normalizeHybridWorldDataset } from "./generator";
import type { HybridWorldDataset, MobileWorldProjection } from "./types";

export function projectWorldToMobile2D(dataset: HybridWorldDataset | null | undefined): MobileWorldProjection {
  try {
    const world = normalizeHybridWorldDataset(dataset);
    return {
      heroRoom: world.rooms.find((room) => room.featured) ?? world.rooms[0] ?? null,
      nearbyPlayers: world.players.filter((player) => player.presence !== "offline").slice(0, 8),
      upcomingEvents: world.events.slice(0, 4),
      missions: world.missions.slice(0, MAX_QUESTS).slice(0, 4),
      recentMatches: world.matches.slice(0, MAX_RECENT_MATCHES),
      socialSignals: world.socialSignals.slice(0, 8),
      portals: world.portals,
      scoreboard: world.scoreboard,
      metrics: world.metrics,
      generatedAt: world.generatedAt,
      mode: world.mode,
    };
  } catch {
    const fallback = createFallbackHybridWorldDataset();
    return {
      heroRoom: fallback.rooms[0] ?? null,
      nearbyPlayers: fallback.players,
      upcomingEvents: fallback.events.slice(0, 4),
      missions: fallback.missions.slice(0, 4),
      recentMatches: fallback.matches.slice(0, MAX_RECENT_MATCHES),
      socialSignals: fallback.socialSignals.slice(0, 8),
      portals: fallback.portals,
      scoreboard: fallback.scoreboard,
      metrics: fallback.metrics,
      generatedAt: fallback.generatedAt,
      mode: fallback.mode,
    };
  }
}
