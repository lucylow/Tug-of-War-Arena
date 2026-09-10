import {
  DEMO_MODE,
  HYBRID_PROTOCOL_VERSION,
  HYBRID_WORLD_SEED,
  MAX_EVENTS,
  MAX_QUESTS,
  MAX_ROOMS_ON_BOARD,
  MAX_SOCIAL_SIGNALS,
  MAX_VISIBLE_PLAYERS,
} from "./constants";
import { SeededWorldRandom } from "./seed";
import type {
  HybridWorldDataset,
  Team,
  Vec3,
  WorldEventDemo,
  WorldMatchDemo,
  WorldMetricsDemo,
  WorldMissionDemo,
  WorldPlayerDemo,
  WorldPortalDemo,
  WorldPresence,
  WorldRoomDemo,
  WorldRoomPhase,
  WorldScoreboardDemo,
  WorldSocialKind,
  WorldSocialSignalDemo,
  WorldZone,
} from "./types";

const FEATURED_PLAYERS: ReadonlyArray<{
  displayName: string;
  team: Team;
  zone: WorldZone;
  highlighted: boolean;
  spawn: Vec3;
}> = [
          { displayName: "NovaWisp", team: "sun", zone: "sun-base", highlighted: true, spawn: { x: 4.6, y: 0.85, z: 16 } },
          { displayName: "PixelRally", team: "moon", zone: "moon-base", highlighted: true, spawn: { x: 27.4, y: 0.85, z: 16 } },
          { displayName: "MoonRunner", team: "moon", zone: "spectator", highlighted: false, spawn: { x: 18.2, y: 0.85, z: 12.4 } },
          { displayName: "SunSpark", team: "sun", zone: "plaza", highlighted: false, spawn: { x: 12.4, y: 0.85, z: 22.6 } },
          { displayName: "RopeWizard", team: "sun", zone: "sun-base", highlighted: true, spawn: { x: 6.2, y: 0.85, z: 14.2 } },
          { displayName: "ArenaFox", team: "sun", zone: "sun-base", highlighted: false, spawn: { x: 8.4, y: 0.85, z: 18.1 } },
          { displayName: "TorqueKid", team: "moon", zone: "moon-base", highlighted: false, spawn: { x: 24.2, y: 0.85, z: 14.8 } },
          { displayName: "CloudPull", team: "sun", zone: "spectator", highlighted: false, spawn: { x: 10.1, y: 0.85, z: 10.6 } },
          { displayName: "NeonTug", team: "moon", zone: "plaza", highlighted: false, spawn: { x: 22.8, y: 0.85, z: 20.4 } },
          { displayName: "OrbitAce", team: "moon", zone: "spectator", highlighted: false, spawn: { x: 16.8, y: 0.85, z: 9.6 } },
          { displayName: "FluxFighter", team: "sun", zone: "plaza", highlighted: false, spawn: { x: 5.4, y: 0.85, z: 21.2 } },
          { displayName: "StarGrip", team: "moon", zone: "moon-base", highlighted: false, spawn: { x: 26.6, y: 0.85, z: 22.1 } },
];

const EXTRA_NAMES = [
  "EmberPull",
  "HaloLine",
  "QuarkTug",
  "NimbusBay",
  "VoltCrew",
  "ShadeHop",
] as const;

const ROOM_PHASES: WorldRoomPhase[] = ["waiting", "countdown", "active", "finished"];
const PRESENCE: WorldPresence[] = ["online", "online", "online", "away", "offline"];
const SIGNAL_KINDS: WorldSocialKind[] = ["reaction", "join", "win", "invite", "streak"];
const SIGNAL_EMOJI: Record<WorldSocialKind, string> = {
  reaction: "✨",
  join: "👋",
  win: "🏆",
  invite: "📨",
  streak: "🔥",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createPlayers(random: SeededWorldRandom): WorldPlayerDemo[] {
  const players: WorldPlayerDemo[] = FEATURED_PLAYERS.map((entry, index) => ({
    id: `player_${index}`,
    displayName: entry.displayName,
    team: entry.team,
    presence: index < 8 ? "online" : random.pick(PRESENCE),
    level: 8 + random.int(0, 12),
    score: 120 + random.int(0, 280),
    pulls: 20 + random.int(0, 80),
    streak: random.int(0, 9),
    wins: 4 + random.int(0, 18),
    losses: random.int(0, 10),
    avatarHue: (index * 37) % 360,
    spawn: entry.spawn,
    zone: entry.zone,
    isHighlighted: entry.highlighted,
  }));

  while (players.length < MAX_VISIBLE_PLAYERS) {
    const index = players.length;
    const team: Team = index % 2 === 0 ? "sun" : "moon";
    const zone: WorldZone =
      team === "sun" ? (index % 4 === 0 ? "plaza" : "sun-base") : index % 3 === 0 ? "spectator" : "moon-base";
    const x = team === "sun" ? 3.4 + random.int(0, 6) : 22 + random.int(0, 6);
    const z = 8 + random.int(0, 16);
    players.push({
      id: `player_${index}`,
      displayName: EXTRA_NAMES[(index - FEATURED_PLAYERS.length) % EXTRA_NAMES.length] ?? `Crewmate${index}`,
      team,
      presence: random.pick(PRESENCE),
      level: 3 + random.int(0, 14),
      score: 40 + random.int(0, 220),
      pulls: random.int(4, 60),
      streak: random.int(0, 6),
      wins: random.int(0, 12),
      losses: random.int(0, 9),
      avatarHue: (index * 41) % 360,
      spawn: { x, y: 0.85, z },
      zone,
      isHighlighted: false,
    });
  }

  return players.slice(0, MAX_VISIBLE_PLAYERS);
}

function createRooms(random: SeededWorldRandom, players: WorldPlayerDemo[]): WorldRoomDemo[] {
  const ids = players.map((player) => player.id);
  const featuredPlayers = ids.slice(0, 5);
  const rooms: WorldRoomDemo[] = [
    {
      id: "room_friday",
      code: "731XZ",
      title: "Friday Night Pull",
      phase: "active",
      playerIds: featuredPlayers,
      maxPlayers: 8,
      ropePosition: 0.16,
      timeRemaining: 18,
      sunScore: 428,
      moonScore: 381,
      featured: true,
    },
    {
      id: "room_rival",
      code: "284KT",
      title: "Sun vs Moon",
      phase: "countdown",
      playerIds: ids.slice(5, 9),
      maxPlayers: 8,
      ropePosition: 0,
      timeRemaining: 8,
      sunScore: 12,
      moonScore: 9,
      featured: false,
    },
    {
      id: "room_rooftop",
      code: "819QP",
      title: "Rooftop Arena",
      phase: "waiting",
      playerIds: ids.slice(9, 15),
      maxPlayers: 8,
      ropePosition: 0,
      timeRemaining: 30,
      sunScore: 0,
      moonScore: 0,
      featured: false,
    },
  ];

  while (rooms.length < MAX_ROOMS_ON_BOARD) {
    const index = rooms.length;
    const phase = ROOM_PHASES[index % ROOM_PHASES.length] ?? "waiting";
    const start = (index * 3) % Math.max(1, ids.length);
    rooms.push({
      id: `room_${index}`,
      code: `${random.int(100, 999)}${String.fromCharCode(65 + random.int(0, 25))}${String.fromCharCode(65 + random.int(0, 25))}`,
      title: index === 3 ? "Dawn Relay" : "Night Watch Pull",
      phase,
      playerIds: ids.slice(start, start + 3),
      maxPlayers: 8,
      ropePosition: phase === "active" ? random.int(-20, 20) / 100 : 0,
      timeRemaining: phase === "finished" ? 0 : random.int(6, 30),
      sunScore: random.int(0, 80),
      moonScore: random.int(0, 80),
      featured: false,
    });
  }

  return rooms.slice(0, MAX_ROOMS_ON_BOARD);
}

function createMatches(random: SeededWorldRandom, rooms: WorldRoomDemo[]): WorldMatchDemo[] {
  const now = 1_725_000_000_000;
  return rooms.slice(0, 5).map((room, index) => {
    const winner: Team = index % 2 === 0 ? "sun" : "moon";
    return {
      id: `match_${index}`,
      roomId: room.id,
      winner,
      sunPulls: 18 + random.int(0, 24),
      moonPulls: 16 + random.int(0, 24),
      durationSeconds: 24 + random.int(0, 20),
      highlight: winner === "sun" ? "Sun Crew held the line" : "Moon Crew stole the finish",
      createdAt: now - index * 18 * 60 * 1000,
    };
  });
}

function createMissions(random: SeededWorldRandom): WorldMissionDemo[] {
  const missions: WorldMissionDemo[] = [
    {
      id: "mission_pulls",
      title: "Pull together",
      description: "Land 20 rope pulls in the featured room.",
      target: 20,
      progress: 12 + random.int(0, 6),
      rewardLabel: "Streak badge",
      complete: false,
      position: { x: 8.2, y: 0.42, z: 11.4 },
    },
    {
      id: "mission_invite",
      title: "Bring the crew",
      description: "Invite 3 friends into a public room.",
      target: 3,
      progress: 1 + random.int(0, 1),
      rewardLabel: "Crew flare",
      complete: false,
      position: { x: 24.1, y: 0.42, z: 11.8 },
    },
    {
      id: "mission_streak",
      title: "Keep the fire",
      description: "Hit a 5-pull streak without dropping.",
      target: 5,
      progress: 3,
      rewardLabel: "Flame emote",
      complete: false,
      position: { x: 16, y: 0.42, z: 8.6 },
    },
    {
      id: "mission_plaza",
      title: "Visit Governance Plaza",
      description: "Walk from the arena to the DAO plaza.",
      target: 1,
      progress: 0,
      rewardLabel: "Plaza pin",
      complete: false,
      position: { x: 16, y: 0.42, z: 22.4 },
    },
    {
      id: "mission_react",
      title: "Cheer a teammate",
      description: "Send 8 social signals from the companion or World.",
      target: 8,
      progress: 8,
      rewardLabel: "Reaction pack",
      complete: true,
      position: { x: 12.6, y: 0.42, z: 19.2 },
    },
  ];
  return missions.slice(0, MAX_QUESTS).map((mission) => ({
    ...mission,
    progress: clamp(mission.progress, 0, mission.target),
    complete: mission.progress >= mission.target,
  }));
}

function createEvents(random: SeededWorldRandom): WorldEventDemo[] {
  const events: WorldEventDemo[] = [
    {
      id: "event_friday",
      kind: "social",
      title: "Friendzone Friday",
      startsInMinutes: 8,
      participants: 24,
      rewardLabel: "Daily badge",
      position: { x: 10.4, y: 0.35, z: 21.6 },
      featured: true,
    },
    {
      id: "event_cup",
      kind: "tournament",
      title: "Sun vs Moon Cup",
      startsInMinutes: 21,
      participants: 38,
      rewardLabel: "Cup flare",
      position: { x: 21.6, y: 0.35, z: 21.2 },
      featured: true,
    },
    {
      id: "event_clash",
      kind: "match",
      title: "Crew Clash",
      startsInMinutes: 29,
      participants: 16,
      rewardLabel: "Crew chest",
      position: { x: 16, y: 0.35, z: 24.8 },
      featured: false,
    },
    {
      id: "event_missions",
      kind: "mission",
      title: "Quest Relay",
      startsInMinutes: 14,
      participants: 11,
      rewardLabel: "XP burst",
      position: { x: 7.4, y: 0.35, z: 19.4 },
      featured: false,
    },
    {
      id: "event_gov",
      kind: "governance",
      title: "Plaza Briefing",
      startsInMinutes: 41,
      participants: 9,
      rewardLabel: "DAO pin",
      position: { x: 16, y: 0.35, z: 26.4 },
      featured: false,
    },
    {
      id: "event_discover",
      kind: "discovery",
      title: "Room Discovery Hour",
      startsInMinutes: 5 + random.int(0, 4),
      participants: 19,
      rewardLabel: "Scout mark",
      position: { x: 16, y: 0.35, z: 28.2 },
      featured: false,
    },
  ];
  return events.slice(0, MAX_EVENTS);
}

function createSignals(random: SeededWorldRandom, players: WorldPlayerDemo[]): WorldSocialSignalDemo[] {
  const templates: Array<{ kind: WorldSocialKind; message: (name: string) => string }> = [
    { kind: "join", message: (name) => `${name} joined the arena` },
    { kind: "reaction", message: (name) => `${name} sent a reaction` },
    { kind: "win", message: (name) => `${name} won the round` },
    { kind: "invite", message: (name) => `${name} invited the crew` },
    { kind: "streak", message: (name) => `${name} hit a streak` },
  ];
  const now = 1_725_000_000_000;
  const signals: WorldSocialSignalDemo[] = [];
  for (let i = 0; i < MAX_SOCIAL_SIGNALS; i += 1) {
    const player = players[i % players.length];
    const template = templates[i % templates.length];
    if (!player || !template) continue;
    const kind = SIGNAL_KINDS.includes(template.kind) ? template.kind : random.pick(SIGNAL_KINDS);
    signals.push({
      id: `signal_${i}`,
      kind,
      actorId: player.id,
      message: template.message(player.displayName),
      emoji: SIGNAL_EMOJI[kind],
      createdAt: now - i * 47_000,
    });
  }
  return signals;
}

function createPortals(): WorldPortalDemo[] {
  return [
    {
      id: "portal_arena",
      title: "ENTER ARENA",
      subtitle: "Walk to the rope and pull",
      target: "arena",
      position: { x: 16, y: 0, z: 8.8 },
    },
    {
      id: "portal_rooms",
      title: "ROOM DISCOVERY",
      subtitle: "Public rooms on the north board",
      target: "rooms",
      position: { x: 11.2, y: 0, z: 28.4 },
    },
    {
      id: "portal_mobile",
      title: "MOBILE COMPANION",
      subtitle: "Open the 2D Friendzone app",
      target: "mobile",
      position: { x: 20.6, y: 0, z: 29.6 },
    },
    {
      id: "portal_gov",
      title: "DAO PLAZA",
      subtitle: "Governance briefing and proposals",
      target: "governance",
      position: { x: 16, y: 0, z: 25.2 },
    },
  ];
}

function leadingTeam(sunScore: number, moonScore: number): Team | "tie" {
  if (sunScore === moonScore) return "tie";
  return sunScore > moonScore ? "sun" : "moon";
}

export function createScoreboard(rooms: WorldRoomDemo[], players: WorldPlayerDemo[]): WorldScoreboardDemo {
  const featured = rooms.find((room) => room.featured) ?? rooms[0];
  const sunScore =
    featured?.sunScore ?? players.filter((player) => player.team === "sun").reduce((sum, player) => sum + player.score, 0);
  const moonScore =
    featured?.moonScore ??
    players.filter((player) => player.team === "moon").reduce((sum, player) => sum + player.score, 0);
  return {
    roomId: featured?.id ?? "room_friday",
    sunScore,
    moonScore,
    ropePosition: featured?.ropePosition ?? 0,
    leadingTeam: leadingTeam(sunScore, moonScore),
    sunCrewLabel: "SUN CREW",
    moonCrewLabel: "MOON CREW",
  };
}

export function calculateMetrics(
  players: WorldPlayerDemo[],
  rooms: WorldRoomDemo[],
  events: WorldEventDemo[],
  matches: WorldMatchDemo[],
  socialSignals: WorldSocialSignalDemo[],
): WorldMetricsDemo {
  return {
    onlinePlayers: players.filter((player) => player.presence === "online").length,
    activeRooms: rooms.filter((room) => room.phase === "active" || room.phase === "countdown").length,
    upcomingEvents: events.length,
    matchesToday: matches.length,
    socialSignals: socialSignals.length,
    communityScore: rooms.reduce((sum, room) => sum + room.sunScore + room.moonScore, 0),
  };
}

function asObject<T extends object>(value: unknown): T | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : null;
}

function asList<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : null;
}

function asFinite(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asVec3(value: unknown, fallback: Vec3): Vec3 {
  const record = asObject<Vec3>(value);
  const x = Number(record?.x);
  const y = Number(record?.y);
  const z = Number(record?.z);
  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
    z: Number.isFinite(z) ? z : fallback.z,
  };
}

function sanitizePlayers(players: WorldPlayerDemo[], fallback: WorldPlayerDemo[]): WorldPlayerDemo[] {
  const template = fallback[0];
  if (!template) return players;
  return players.map((player, index) => ({
    ...template,
    ...player,
    id: typeof player.id === "string" && player.id ? player.id : `player_${index}`,
    displayName:
      typeof player.displayName === "string" && player.displayName.trim() ? player.displayName : template.displayName,
    team: player.team === "moon" ? "moon" : "sun",
    presence: player.presence === "offline" || player.presence === "away" ? player.presence : "online",
    spawn: asVec3(player.spawn, template.spawn),
    zone: player.zone || template.zone,
    isHighlighted: Boolean(player.isHighlighted),
    level: asFinite(player.level, template.level),
    score: asFinite(player.score, template.score),
    pulls: asFinite(player.pulls, template.pulls),
    streak: asFinite(player.streak, template.streak),
    wins: asFinite(player.wins, template.wins),
    losses: asFinite(player.losses, template.losses),
    avatarHue: asFinite(player.avatarHue, template.avatarHue),
  }));
}

function sanitizeRooms(rooms: WorldRoomDemo[], fallback: WorldRoomDemo[]): WorldRoomDemo[] {
  const template = fallback[0];
  if (!template) return rooms;
  return rooms.map((room, index) => ({
    ...template,
    ...room,
    id: typeof room.id === "string" && room.id ? room.id : `room_${index}`,
    code: typeof room.code === "string" && room.code ? room.code : template.code,
    title: typeof room.title === "string" && room.title ? room.title : template.title,
    phase: room.phase === "countdown" || room.phase === "active" || room.phase === "finished" ? room.phase : "waiting",
    playerIds: Array.isArray(room.playerIds) ? room.playerIds.filter((id): id is string => typeof id === "string") : [],
    maxPlayers: Math.max(1, asFinite(room.maxPlayers, template.maxPlayers)),
    ropePosition: asFinite(room.ropePosition, 0),
    timeRemaining: asFinite(room.timeRemaining, 0),
    sunScore: asFinite(room.sunScore, 0),
    moonScore: asFinite(room.moonScore, 0),
    featured: Boolean(room.featured),
  }));
}

export function createEmptyHybridWorldDataset(): HybridWorldDataset {
  const rooms: WorldRoomDemo[] = [];
  const players: WorldPlayerDemo[] = [];
  return {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    generatedAt: Date.now(),
    mode: "demo",
    origin: { origin: "demo" },
    players,
    rooms,
    events: [],
    missions: [],
    matches: [],
    socialSignals: [],
    portals: [],
    scoreboard: createScoreboard(rooms, players),
    metrics: calculateMetrics(players, rooms, [], [], []),
  };
}

/** Static seeded plaza used when generation or live data fails. */
export function createFallbackHybridWorldDataset(): HybridWorldDataset {
  const players: WorldPlayerDemo[] = [
    {
      id: "player_0",
      displayName: "NovaWisp",
      team: "sun",
      presence: "online",
      level: 12,
      score: 240,
      pulls: 48,
      streak: 3,
      wins: 9,
      losses: 4,
      avatarHue: 0,
      spawn: { x: 4.6, y: 0.85, z: 16 },
      zone: "sun-base",
      isHighlighted: true,
    },
    {
      id: "player_1",
      displayName: "PixelRally",
      team: "moon",
      presence: "online",
      level: 11,
      score: 220,
      pulls: 41,
      streak: 2,
      wins: 8,
      losses: 5,
      avatarHue: 37,
      spawn: { x: 27.4, y: 0.85, z: 16 },
      zone: "moon-base",
      isHighlighted: true,
    },
    {
      id: "player_2",
      displayName: "MoonRunner",
      team: "moon",
      presence: "away",
      level: 9,
      score: 160,
      pulls: 28,
      streak: 1,
      wins: 5,
      losses: 3,
      avatarHue: 74,
      spawn: { x: 18.2, y: 0.85, z: 12.4 },
      zone: "spectator",
      isHighlighted: false,
    },
  ];
  const rooms: WorldRoomDemo[] = [
    {
      id: "room_friday",
      code: "731XZ",
      title: "Friday Night Pull",
      phase: "active",
      playerIds: players.map((player) => player.id),
      maxPlayers: 8,
      ropePosition: 0.16,
      timeRemaining: 18,
      sunScore: 428,
      moonScore: 381,
      featured: true,
    },
  ];
  const events: WorldEventDemo[] = [
    {
      id: "event_friday",
      kind: "social",
      title: "Friendzone Friday",
      startsInMinutes: 8,
      participants: 24,
      rewardLabel: "Daily badge",
      position: { x: 10.4, y: 0.35, z: 21.6 },
      featured: true,
    },
    {
      id: "event_cup",
      kind: "tournament",
      title: "Sun vs Moon Cup",
      startsInMinutes: 21,
      participants: 38,
      rewardLabel: "Cup flare",
      position: { x: 21.6, y: 0.35, z: 21.2 },
      featured: true,
    },
  ];
  const missions: WorldMissionDemo[] = [
    {
      id: "mission_pulls",
      title: "Pull together",
      description: "Land 20 rope pulls in the featured room.",
      target: 20,
      progress: 12,
      rewardLabel: "Streak badge",
      complete: false,
      position: { x: 8.2, y: 0.42, z: 11.4 },
    },
  ];
  const matches: WorldMatchDemo[] = [
    {
      id: "match_0",
      roomId: "room_friday",
      winner: "sun",
      sunPulls: 22,
      moonPulls: 18,
      durationSeconds: 28,
      highlight: "Sun Crew held the line",
      createdAt: 1_725_000_000_000,
    },
  ];
  const socialSignals: WorldSocialSignalDemo[] = [
    {
      id: "signal_0",
      kind: "join",
      actorId: "player_0",
      message: "NovaWisp joined the arena",
      emoji: "👋",
      createdAt: 1_725_000_000_000,
    },
  ];
  return {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    generatedAt: Date.now(),
    mode: "demo",
    origin: { origin: "demo" },
    players,
    rooms,
    events,
    missions,
    matches,
    socialSignals,
    portals: createPortals(),
    scoreboard: createScoreboard(rooms, players),
    metrics: calculateMetrics(players, rooms, events, matches, socialSignals),
  };
}

export function normalizeHybridWorldDataset(dataset: HybridWorldDataset | null | undefined): HybridWorldDataset {
  const fallback = createFallbackHybridWorldDataset();
  if (!dataset || typeof dataset !== "object") return fallback;

  const players = sanitizePlayers(asList<WorldPlayerDemo>(dataset.players) ?? fallback.players, fallback.players);
  const rooms = sanitizeRooms(asList<WorldRoomDemo>(dataset.rooms) ?? fallback.rooms, fallback.rooms);
  const events = asList<WorldEventDemo>(dataset.events) ?? fallback.events;
  const missions = asList<WorldMissionDemo>(dataset.missions) ?? fallback.missions;
  const matches = asList<WorldMatchDemo>(dataset.matches) ?? fallback.matches;
  const socialSignals = asList<WorldSocialSignalDemo>(dataset.socialSignals) ?? fallback.socialSignals;
  const portals = asList<WorldPortalDemo>(dataset.portals) ?? fallback.portals;
  const computedScoreboard = createScoreboard(rooms, players);
  const scoreboardRecord = asObject<WorldScoreboardDemo>(dataset.scoreboard);
  const metricsRecord = asObject<WorldMetricsDemo>(dataset.metrics);

  return {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    generatedAt: Number.isFinite(Number(dataset.generatedAt)) ? Number(dataset.generatedAt) : Date.now(),
    mode: dataset.mode === "live" ? "live" : "demo",
    origin: { origin: "demo" },
    players,
    rooms,
    events,
    missions,
    matches,
    socialSignals,
    portals,
    scoreboard: scoreboardRecord
      ? {
          ...computedScoreboard,
          ...scoreboardRecord,
          roomId: scoreboardRecord.roomId || computedScoreboard.roomId,
          sunScore: Number.isFinite(Number(scoreboardRecord.sunScore))
            ? Number(scoreboardRecord.sunScore)
            : computedScoreboard.sunScore,
          moonScore: Number.isFinite(Number(scoreboardRecord.moonScore))
            ? Number(scoreboardRecord.moonScore)
            : computedScoreboard.moonScore,
          ropePosition: Number.isFinite(Number(scoreboardRecord.ropePosition))
            ? Number(scoreboardRecord.ropePosition)
            : computedScoreboard.ropePosition,
          leadingTeam: scoreboardRecord.leadingTeam || computedScoreboard.leadingTeam,
          sunCrewLabel: scoreboardRecord.sunCrewLabel || computedScoreboard.sunCrewLabel,
          moonCrewLabel: scoreboardRecord.moonCrewLabel || computedScoreboard.moonCrewLabel,
        }
      : computedScoreboard,
    metrics: metricsRecord
      ? { ...calculateMetrics(players, rooms, events, matches, socialSignals), ...metricsRecord }
      : calculateMetrics(players, rooms, events, matches, socialSignals),
  };
}

export function createHybridWorldDataset(seed = HYBRID_WORLD_SEED): HybridWorldDataset {
  const random = new SeededWorldRandom(Number.isFinite(seed) ? seed : HYBRID_WORLD_SEED);
  const players = createPlayers(random);
  const rooms = createRooms(random, players);
  const matches = createMatches(random, rooms);
  const missions = createMissions(random);
  const events = createEvents(random);
  const socialSignals = createSignals(random, players);

  if (players.length === 0 || rooms.length === 0) {
    return createFallbackHybridWorldDataset();
  }

  return {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    generatedAt: Date.now(),
    mode: DEMO_MODE ? "demo" : "live",
    origin: { origin: "demo" },
    players,
    rooms,
    events,
    missions,
    matches,
    socialSignals,
    portals: createPortals(),
    scoreboard: createScoreboard(rooms, players),
    metrics: calculateMetrics(players, rooms, events, matches, socialSignals),
  };
}

export function createHybridWorldDatasetSafe(seed = HYBRID_WORLD_SEED): HybridWorldDataset {
  try {
    return normalizeHybridWorldDataset(createHybridWorldDataset(seed));
  } catch {
    return createFallbackHybridWorldDataset();
  }
}
