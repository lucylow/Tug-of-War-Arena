import { calculateMetrics, createFallbackHybridWorldDataset, createScoreboard } from "./generator";
import type { DemoScenario, HybridWorldDataset, WorldPresence } from "./types";

function withPresence(dataset: HybridWorldDataset, presence: WorldPresence): HybridWorldDataset {
  const players = dataset.players.map((player, index) => ({
    ...player,
    presence: index === 0 ? "online" : presence,
  }));
  return {
    ...dataset,
    players,
    metrics: calculateMetrics(players, dataset.rooms, dataset.events, dataset.matches, dataset.socialSignals),
  };
}

export function applyDemoScenario(dataset: HybridWorldDataset | null | undefined, scenario: DemoScenario): HybridWorldDataset {
  const source =
    dataset && typeof dataset === "object"
      ? {
          ...dataset,
          players: Array.isArray(dataset.players) ? dataset.players : [],
          rooms: Array.isArray(dataset.rooms) ? dataset.rooms : [],
          events: Array.isArray(dataset.events) ? dataset.events : [],
          missions: Array.isArray(dataset.missions) ? dataset.missions : [],
          matches: Array.isArray(dataset.matches) ? dataset.matches : [],
          socialSignals: Array.isArray(dataset.socialSignals) ? dataset.socialSignals : [],
        }
      : createFallbackHybridWorldDataset();

  if (scenario === "fresh") {
    const rooms = source.rooms.map((room, index) => ({
      ...room,
      phase: index === 0 ? ("waiting" as const) : room.phase === "finished" ? room.phase : ("waiting" as const),
      sunScore: index === 0 ? 0 : room.sunScore,
      moonScore: index === 0 ? 0 : room.moonScore,
      ropePosition: 0,
    }));
    const players = source.players.map((player, index) => ({
      ...player,
      presence: index < 4 ? ("online" as const) : ("offline" as const),
    }));
    return {
      ...source,
      players,
      rooms,
      scoreboard: createScoreboard(rooms, players),
      metrics: calculateMetrics(players, rooms, source.events, source.matches, source.socialSignals),
    };
  }

  if (scenario === "busy-plaza") {
    const players = source.players.map((player) => ({ ...player, presence: "online" as const }));
    return {
      ...source,
      players,
      metrics: calculateMetrics(players, source.rooms, source.events, source.matches, source.socialSignals),
    };
  }

  if (scenario === "active-match") {
    const rooms = source.rooms.map((room) =>
      room.featured ? { ...room, phase: "active" as const, timeRemaining: Math.max(8, room.timeRemaining) } : room,
    );
    return {
      ...source,
      rooms,
      scoreboard: createScoreboard(rooms, source.players),
      metrics: calculateMetrics(source.players, rooms, source.events, source.matches, source.socialSignals),
    };
  }

  if (scenario === "mission-ready") {
    const missions = source.missions.map((mission) => ({
      ...mission,
      complete: false,
      progress: Math.max(0, mission.target - 1),
    }));
    return { ...source, missions };
  }

  if (scenario === "tournament") {
    const events = source.events.map((event) =>
      event.kind === "tournament" ? { ...event, featured: true, startsInMinutes: 4, participants: 48 } : event,
    );
    return { ...source, events };
  }

  if (scenario === "offline-companion") {
    return withPresence(source, "offline");
  }

  return source;
}

export const DEMO_SCENARIO_LABELS: Record<DemoScenario, string> = {
  fresh: "Fresh",
  "busy-plaza": "Busy plaza",
  "active-match": "Active match",
  "mission-ready": "Mission ready",
  tournament: "Tournament",
  "offline-companion": "Offline 2D",
};