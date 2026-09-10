import { createCanonicalWorldFeed } from "@/shared/demo-world";
import type {
  MobileEventCard,
  MobileMissionCard,
  MobilePresenceCard,
  MobileRoomCard,
  MobileWorldProjection,
  WorldFeed,
} from "@/shared/friendzone-world-protocol";
import type { HybridWorldDataset } from "@/lib/hybrid-world";

function asFeed(input: WorldFeed | HybridWorldDataset | null | undefined): WorldFeed {
  if (input && "version" in input && Array.isArray(input.players) && "scoreboard" in input && "timeLabel" in (input.scoreboard ?? {})) {
    return input as WorldFeed;
  }
  if (input && "rooms" in input && Array.isArray((input as HybridWorldDataset).rooms)) {
    return worldFeedFromHybrid(input as HybridWorldDataset);
  }
  return createCanonicalWorldFeed();
}

export function worldFeedFromHybrid(dataset: HybridWorldDataset): WorldFeed {
  const fallback = createCanonicalWorldFeed(dataset.generatedAt);
  return {
    ...fallback,
    generatedAt: dataset.generatedAt,
    players: dataset.players.slice(0, 18).map((player) => ({
      id: player.id,
      displayName: player.displayName,
      team: player.team,
      score: player.score,
      streak: player.streak,
      presence: player.presence,
      position: player.spawn,
      origin: "demo",
    })),
    rooms: dataset.rooms.slice(0, 5).map((room) => ({
      id: room.id,
      code: room.code,
      title: room.title,
      playerCount: room.playerIds.length,
      capacity: room.maxPlayers,
      phase: room.phase === "active" ? "active" : room.phase === "finished" ? "finished" : "lobby",
      sunScore: room.sunScore,
      moonScore: room.moonScore,
      origin: "demo",
    })),
    scoreboard: {
      sunScore: dataset.scoreboard.sunScore,
      moonScore: dataset.scoreboard.moonScore,
      timeLabel: fallback.scoreboard.timeLabel,
      roomTitle: dataset.rooms[0]?.title ?? fallback.scoreboard.roomTitle,
      roomCode: dataset.rooms[0]?.code ?? fallback.scoreboard.roomCode,
    },
  };
}

export function projectPlayersToPresence(feed: WorldFeed): MobilePresenceCard[] {
  return feed.players
    .filter((player) => player.presence !== "offline")
    .slice(0, 8)
    .map((player) => ({
      id: player.id,
      displayName: player.displayName,
      team: player.team,
      presence: player.presence,
      origin: "demo",
    }));
}

export function projectRoomsToCards(feed: WorldFeed): MobileRoomCard[] {
  return feed.rooms.map((room) => ({
    id: room.id,
    title: room.title,
    code: room.code,
    phase: room.phase,
    playerCount: room.playerCount,
    capacity: room.capacity,
    origin: "demo",
  }));
}

export function projectEventsToCards(feed: WorldFeed): MobileEventCard[] {
  return feed.events.map((event) => ({
    id: event.id,
    title: event.title,
    kind: event.kind,
    origin: "demo",
  }));
}

export function projectMissionsToCards(feed: WorldFeed): MobileMissionCard[] {
  return feed.missions.map((mission) => ({
    id: mission.id,
    title: mission.title,
    progress: mission.progress,
    target: mission.target,
    origin: "demo",
  }));
}

export function projectWorldFeedToMobile(input?: WorldFeed | HybridWorldDataset | null): MobileWorldProjection {
  const feed = asFeed(input);
  const presence = projectPlayersToPresence(feed);
  return {
    presence,
    rooms: projectRoomsToCards(feed),
    events: projectEventsToCards(feed),
    missions: projectMissionsToCards(feed),
    onlineDemoCount: presence.length,
    scoreboard: feed.scoreboard,
    origin: "demo",
  };
}

export function projectWorldToMinimapPoints(feed: WorldFeed): Array<{ id: string; x: number; z: number; team: "sun" | "moon"; kind: "player" | "room" | "event" }> {
  const players = feed.players
    .filter((player) => player.presence !== "offline")
    .map((player) => ({ id: player.id, x: player.position.x, z: player.position.z, team: player.team, kind: "player" as const }));
  const rooms = feed.rooms.map((room, index) => ({
    id: room.id,
    x: 16 + (index - 2) * 3,
    z: 16,
    team: room.sunScore >= room.moonScore ? ("sun" as const) : ("moon" as const),
    kind: "room" as const,
  }));
  const events = feed.events.slice(0, 8).map((event, index) => ({
    id: event.id,
    x: 8 + index * 2,
    z: 8,
    team: index % 2 === 0 ? ("sun" as const) : ("moon" as const),
    kind: "event" as const,
  }));
  return [...players, ...rooms, ...events];
}
