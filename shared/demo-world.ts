import type {
  WorldActivity,
  WorldEvent,
  WorldFeed,
  WorldGovernance,
  WorldMatchSummary,
  WorldMission,
  WorldPlayer,
  WorldRoom,
} from "./friendzone-world-protocol";

export const CANONICAL_WORLD_SEED = 20260910;
export const FEATURED_ROOM_CODE = "731XZ";
export const FEATURED_ROOM_TITLE = "Friday Night Pull";
export const FEATURED_MISSION_TITLE = "Pull Together";
export const FEATURED_EVENT_TITLE = "Sun vs Moon Cup";

const PLAYER_SEED: Array<Pick<WorldPlayer, "displayName" | "team" | "presence" | "score" | "streak" | "position">> = [
  { displayName: "NovaWisp", team: "sun", presence: "online", score: 1084, streak: 4, position: { x: 4.6, y: 0.85, z: 16 } },
  { displayName: "PixelRally", team: "moon", presence: "online", score: 88, streak: 3, position: { x: 27.4, y: 0.85, z: 16 } },
  { displayName: "MoonRunner", team: "moon", presence: "online", score: 74, streak: 2, position: { x: 18.2, y: 0.85, z: 12.4 } },
  { displayName: "SunSpark", team: "sun", presence: "online", score: 81, streak: 5, position: { x: 12.4, y: 0.85, z: 22.6 } },
  { displayName: "RopeWizard", team: "sun", presence: "online", score: 90, streak: 6, position: { x: 6.2, y: 0.85, z: 14.2 } },
  { displayName: "ArenaFox", team: "sun", presence: "online", score: 67, streak: 1, position: { x: 8.4, y: 0.85, z: 18.1 } },
  { displayName: "TorqueKid", team: "moon", presence: "online", score: 71, streak: 2, position: { x: 24.2, y: 0.85, z: 14.8 } },
  { displayName: "CloudPull", team: "sun", presence: "away", score: 58, streak: 0, position: { x: 10.1, y: 0.85, z: 10.6 } },
  { displayName: "NeonTug", team: "moon", presence: "online", score: 63, streak: 3, position: { x: 22.8, y: 0.85, z: 20.4 } },
  { displayName: "OrbitAce", team: "moon", presence: "online", score: 77, streak: 4, position: { x: 16.8, y: 0.85, z: 9.6 } },
  { displayName: "FluxFighter", team: "sun", presence: "away", score: 54, streak: 1, position: { x: 5.4, y: 0.85, z: 21.2 } },
  { displayName: "StarGrip", team: "moon", presence: "offline", score: 49, streak: 0, position: { x: 26.6, y: 0.85, z: 22.1 } },
  { displayName: "EmberPull", team: "sun", presence: "online", score: 42, streak: 1, position: { x: 7.1, y: 0.85, z: 11.8 } },
  { displayName: "HaloLine", team: "moon", presence: "away", score: 39, streak: 0, position: { x: 25.4, y: 0.85, z: 11.2 } },
  { displayName: "QuarkTug", team: "sun", presence: "offline", score: 33, streak: 0, position: { x: 11.6, y: 0.85, z: 24.4 } },
  { displayName: "NimbusBay", team: "moon", presence: "online", score: 46, streak: 2, position: { x: 20.2, y: 0.85, z: 24.1 } },
  { displayName: "VoltCrew", team: "sun", presence: "online", score: 51, streak: 2, position: { x: 14.2, y: 0.85, z: 8.4 } },
  { displayName: "ShadeHop", team: "moon", presence: "offline", score: 28, streak: 0, position: { x: 19.4, y: 0.85, z: 8.2 } },
];

const ROOM_SEED: Array<Omit<WorldRoom, "origin">> = [
  { id: "room_friday", code: FEATURED_ROOM_CODE, title: FEATURED_ROOM_TITLE, playerCount: 8, capacity: 8, phase: "active", sunScore: 428, moonScore: 381 },
  { id: "room_rival", code: "284KT", title: "Sun vs Moon", playerCount: 4, capacity: 8, phase: "lobby", sunScore: 12, moonScore: 9 },
  { id: "room_rooftop", code: "819QP", title: "Rooftop Arena", playerCount: 6, capacity: 8, phase: "lobby", sunScore: 0, moonScore: 0 },
  { id: "room_dawn", code: "441LM", title: "Dawn Relay", playerCount: 3, capacity: 8, phase: "finished", sunScore: 64, moonScore: 51 },
  { id: "room_night", code: "902VW", title: "Night Watch Pull", playerCount: 5, capacity: 8, phase: "active", sunScore: 22, moonScore: 25 },
];

const MISSION_SEED: Array<Omit<WorldMission, "origin">> = [
  { id: "mission_pulls", title: FEATURED_MISSION_TITLE, progress: 84, target: 100 },
  { id: "mission_invite", title: "Bring the Crew", progress: 2, target: 3 },
  { id: "mission_streak", title: "Keep the Fire", progress: 3, target: 5 },
  { id: "mission_plaza", title: "Visit Governance Plaza", progress: 0, target: 1 },
  { id: "mission_react", title: "Cheer a Teammate", progress: 8, target: 8 },
];

const EVENT_SEED: Array<Omit<WorldEvent, "origin">> = [
  { id: "event_cup", title: FEATURED_EVENT_TITLE, kind: "tournament", startsAt: CANONICAL_WORLD_SEED },
  { id: "event_friday", title: "Friendzone Friday", kind: "social", startsAt: CANONICAL_WORLD_SEED + 1 },
  { id: "event_clash", title: "Crew Clash", kind: "crew", startsAt: CANONICAL_WORLD_SEED + 2 },
  { id: "event_briefing", title: "Plaza Briefing", kind: "governance", startsAt: CANONICAL_WORLD_SEED + 3 },
  { id: "event_relay", title: "Quest Relay", kind: "crew", startsAt: CANONICAL_WORLD_SEED + 4 },
  { id: "event_after", title: "Afterglow Social", kind: "social", startsAt: CANONICAL_WORLD_SEED + 5 },
  { id: "event_draft", title: "Wearable Draft", kind: "governance", startsAt: CANONICAL_WORLD_SEED + 6 },
  { id: "event_open", title: "Open Arena Night", kind: "tournament", startsAt: CANONICAL_WORLD_SEED + 7 },
];

const GOVERNANCE: WorldGovernance = {
  proposalTitle: "DEMO: Keep the Friday Night Pull public",
  discussionLinks: [
    "https://forum.decentraland.org/",
    "https://governance.decentraland.org/",
  ],
  daoUrl: "https://governance.decentraland.org/",
  origin: "demo",
};

function withOrigin<T extends object>(value: T): T & { origin: "demo" } {
  return { ...value, origin: "demo" };
}

export function createCanonicalWorldFeed(generatedAt = CANONICAL_WORLD_SEED): WorldFeed {
  const players: WorldPlayer[] = PLAYER_SEED.map((player, index) =>
    withOrigin({
      id: `player_${index}`,
      ...player,
    }),
  );
  const rooms: WorldRoom[] = ROOM_SEED.map((room) => withOrigin(room));
  const missions: WorldMission[] = MISSION_SEED.map((mission) => withOrigin(mission));
  const events: WorldEvent[] = EVENT_SEED.map((event) => withOrigin(event));
  const matches: WorldMatchSummary[] = Array.from({ length: 24 }, (_, index) =>
    withOrigin({
      id: `match_${index}`,
      roomId: rooms[index % rooms.length]?.id ?? "room_friday",
      winner: index % 2 === 0 ? ("sun" as const) : ("moon" as const),
      highlight: index % 2 === 0 ? "Sun Crew held the line" : "Moon Crew stole the finish",
    }),
  );
  const activity: WorldActivity[] = Array.from({ length: 24 }, (_, index) =>
    withOrigin({
      id: `activity_${index}`,
      actor: players[index % players.length]?.displayName ?? "NovaWisp",
      message: `${players[index % players.length]?.displayName ?? "NovaWisp"} ${index % 3 === 0 ? "pulled" : index % 3 === 1 ? "cheered" : "joined"}`,
    }),
  );
  const reactions: WorldActivity[] = Array.from({ length: 20 }, (_, index) =>
    withOrigin({
      id: `reaction_${index}`,
      actor: players[index % players.length]?.displayName ?? "NovaWisp",
      message: index % 2 === 0 ? "🔥" : "⚡",
    }),
  );

  return {
    version: 1,
    generatedAt,
    origin: "demo",
    players,
    rooms,
    missions,
    events,
    matches,
    activity,
    reactions,
    governance: GOVERNANCE,
    scoreboard: {
      sunScore: 428,
      moonScore: 381,
      timeLabel: "00:42",
      roomTitle: FEATURED_ROOM_TITLE,
      roomCode: FEATURED_ROOM_CODE,
    },
  };
}

export function serializeWorldFeed(feed: WorldFeed): string {
  return JSON.stringify(feed);
}

export function parseWorldFeed(raw: string): WorldFeed | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Partial<WorldFeed>;
    if (record.origin !== "demo") return null;
    if (!Array.isArray(record.players) || !Array.isArray(record.rooms)) return null;
    return createCanonicalWorldFeed(typeof record.generatedAt === "number" ? record.generatedAt : CANONICAL_WORLD_SEED);
  } catch {
    return null;
  }
}

export function parseWorldFeedOrFallback(raw: string): WorldFeed {
  return parseWorldFeed(raw) ?? createCanonicalWorldFeed();
}

export function resetDemoUniverse(seed = CANONICAL_WORLD_SEED): WorldFeed {
  return createCanonicalWorldFeed(Number.isFinite(seed) ? seed : CANONICAL_WORLD_SEED);
}
