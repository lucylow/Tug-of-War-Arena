import { MAX_QUESTS, MAX_RECENT_MATCHES } from "./constants";
import type { HybridWorldDataset, MobileWorldProjection } from "./types";

export function projectWorldToMobile2D(dataset: HybridWorldDataset): MobileWorldProjection {
  const rooms = Array.isArray(dataset?.rooms) ? dataset.rooms : [];
  const players = Array.isArray(dataset?.players) ? dataset.players : [];
  const events = Array.isArray(dataset?.events) ? dataset.events : [];
  const missions = Array.isArray(dataset?.missions) ? dataset.missions : [];
  const matches = Array.isArray(dataset?.matches) ? dataset.matches : [];
  const socialSignals = Array.isArray(dataset?.socialSignals) ? dataset.socialSignals : [];
  return {
    heroRoom: rooms.find((room) => room.featured) ?? rooms[0] ?? null,
    nearbyPlayers: players.filter((player) => player.presence !== "offline").slice(0, 8),
    upcomingEvents: events.slice(0, 4),
    missions: missions.slice(0, MAX_QUESTS).slice(0, 4),
    recentMatches: matches.slice(0, MAX_RECENT_MATCHES),
    socialSignals: socialSignals.slice(0, 8),
    portals: Array.isArray(dataset?.portals) ? dataset.portals : [],
    scoreboard: dataset.scoreboard,
    metrics: dataset.metrics,
    generatedAt: dataset.generatedAt,
    mode: dataset.mode,
  };
}
