import { calculateMetrics, createScoreboard } from "./generator";
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

export function applyDemoScenario(dataset: HybridWorldDataset, scenario: DemoScenario): HybridWorldDataset {
  if (scenario === "fresh") {
    const rooms = dataset.rooms.map((room, index) => ({
      ...room,
      phase: index === 0 ? ("waiting" as const) : room.phase === "finished" ? room.phase : ("waiting" as const),
      sunScore: index === 0 ? 0 : room.sunScore,
      moonScore: index === 0 ? 0 : room.moonScore,
      ropePosition: 0,
    }));
    const players = dataset.players.map((player, index) => ({
      ...player,
      presence: index < 4 ? ("online" as const) : ("offline" as const),
    }));
    return {
      ...dataset,
      players,
      rooms,
      scoreboard: createScoreboard(rooms, players),
      metrics: calculateMetrics(players, rooms, dataset.events, dataset.matches, dataset.socialSignals),
    };
  }

  if (scenario === "busy-plaza") {
    const players = dataset.players.map((player) => ({ ...player, presence: "online" as const }));
    return {
      ...dataset,
      players,
      metrics: calculateMetrics(players, dataset.rooms, dataset.events, dataset.matches, dataset.socialSignals),
    };
  }

  if (scenario === "active-match") {
    const rooms = dataset.rooms.map((room) =>
      room.featured ? { ...room, phase: "active" as const, timeRemaining: Math.max(8, room.timeRemaining) } : room,
    );
    return {
      ...dataset,
      rooms,
      scoreboard: createScoreboard(rooms, dataset.players),
      metrics: calculateMetrics(dataset.players, rooms, dataset.events, dataset.matches, dataset.socialSignals),
    };
  }

  if (scenario === "mission-ready") {
    const missions = dataset.missions.map((mission) => ({
      ...mission,
      complete: false,
      progress: Math.max(0, mission.target - 1),
    }));
    return { ...dataset, missions };
  }

  if (scenario === "tournament") {
    const events = dataset.events.map((event) =>
      event.kind === "tournament" ? { ...event, featured: true, startsInMinutes: 4, participants: 48 } : event,
    );
    return { ...dataset, events };
  }

  if (scenario === "offline-companion") {
    return withPresence(dataset, "offline");
  }

  return dataset;
}

export const DEMO_SCENARIO_LABELS: Record<DemoScenario, string> = {
  fresh: "Fresh",
  "busy-plaza": "Busy plaza",
  "active-match": "Active match",
  "mission-ready": "Mission ready",
  tournament: "Tournament",
  "offline-companion": "Offline 2D",
};
