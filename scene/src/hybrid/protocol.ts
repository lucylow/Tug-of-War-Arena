import { HYBRID_PROTOCOL_VERSION } from "./constants";
import { createFallbackHybridWorldDataset, normalizeHybridWorldDataset } from "./generator";
import type {
  HybridSimulationState,
  HybridWorldDataset,
  WorldFeedEnvelope,
  WorldFeedSource,
  WorldRoomPhase,
  WorldSyncPacket,
  WorldSyncSource,
} from "./types";

const FEED_SOURCES: readonly WorldFeedSource[] = ["mobile-2d", "world-3d"];
const SYNC_SOURCES: readonly WorldSyncSource[] = ["shared", "mobile-2d", "world-3d"];
const ROOM_PHASES: readonly WorldRoomPhase[] = ["waiting", "countdown", "active", "finished"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampRope(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function asNonNegativeInt(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(asFiniteNumber(value, fallback)));
}

function isFeedSource(value: unknown): value is WorldFeedSource {
  return typeof value === "string" && (FEED_SOURCES as readonly string[]).includes(value);
}

function isSyncSource(value: unknown): value is WorldSyncSource {
  return typeof value === "string" && (SYNC_SOURCES as readonly string[]).includes(value);
}

function isRoomPhase(value: unknown): value is WorldRoomPhase {
  return typeof value === "string" && (ROOM_PHASES as readonly string[]).includes(value);
}

function isUsableDataset(value: unknown): value is HybridWorldDataset {
  if (!isRecord(value)) return false;
  return Array.isArray(value.players) && Array.isArray(value.rooms) && isRecord(value.scoreboard);
}

export function serializeWorldFeed(
  dataset: HybridWorldDataset,
  source: WorldFeedSource = "mobile-2d",
): string {
  try {
    const envelope: WorldFeedEnvelope = {
      protocolVersion: HYBRID_PROTOCOL_VERSION,
      generatedAt: Date.now(),
      source: isFeedSource(source) ? source : "mobile-2d",
      dataset: normalizeHybridWorldDataset(dataset),
    };
    return JSON.stringify(envelope);
  } catch {
    return JSON.stringify({
      protocolVersion: HYBRID_PROTOCOL_VERSION,
      generatedAt: Date.now(),
      source: "mobile-2d",
      dataset: createFallbackHybridWorldDataset(),
    } satisfies WorldFeedEnvelope);
  }
}

export function parseWorldFeed(raw: string): WorldFeedEnvelope | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.protocolVersion !== HYBRID_PROTOCOL_VERSION) return null;
    if (!isFeedSource(parsed.source) || !isUsableDataset(parsed.dataset)) return null;
    return {
      protocolVersion: HYBRID_PROTOCOL_VERSION,
      generatedAt: asFiniteNumber(parsed.generatedAt, Date.now()),
      source: parsed.source,
      dataset: normalizeHybridWorldDataset(parsed.dataset),
    };
  } catch {
    return null;
  }
}

export function parseWorldFeedOrFallback(
  raw: string,
  source: WorldFeedSource = "mobile-2d",
): WorldFeedEnvelope {
  const parsed = parseWorldFeed(raw);
  if (parsed) return parsed;
  return {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    generatedAt: Date.now(),
    source,
    dataset: createFallbackHybridWorldDataset(),
  };
}

export function parseWorldSyncPacket(raw: unknown): WorldSyncPacket | null {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!isRecord(parsed) || parsed.protocolVersion !== HYBRID_PROTOCOL_VERSION) return null;
  if (typeof parsed.roomId !== "string" || !parsed.roomId.trim()) return null;
  if (!isSyncSource(parsed.source) || !isRoomPhase(parsed.phase)) return null;
  return {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    sentAt: asFiniteNumber(parsed.sentAt, Date.now()),
    source: parsed.source,
    roomId: parsed.roomId,
    ropePosition: clampRope(asFiniteNumber(parsed.ropePosition)),
    sunScore: asNonNegativeInt(parsed.sunScore),
    moonScore: asNonNegativeInt(parsed.moonScore),
    phase: parsed.phase,
    highlightedPlayerId: typeof parsed.highlightedPlayerId === "string" ? parsed.highlightedPlayerId : "",
  };
}

export function createWorldSyncPacket(
  state: HybridSimulationState | null | undefined,
  source: WorldSyncSource = "shared",
  sentAt = Date.now(),
): WorldSyncPacket {
  const safe = state && typeof state === "object" ? state : simulationFromDataset(createFallbackHybridWorldDataset());
  return {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    sentAt,
    source: isSyncSource(source) ? source : "shared",
    roomId: typeof safe.roomId === "string" && safe.roomId.trim() ? safe.roomId : "room_friday",
    ropePosition: clampRope(asFiniteNumber(safe.ropePosition)),
    sunScore: asNonNegativeInt(safe.sunScore),
    moonScore: asNonNegativeInt(safe.moonScore),
    phase: isRoomPhase(safe.phase) ? safe.phase : "active",
    highlightedPlayerId: typeof safe.highlightedPlayerId === "string" ? safe.highlightedPlayerId : "player_0",
  };
}

export function applyWorldSyncPacket(dataset: HybridWorldDataset, packet: WorldSyncPacket): HybridWorldDataset {
  const valid = parseWorldSyncPacket(packet);
  if (!valid) return dataset;
  const world = normalizeHybridWorldDataset(dataset);
  const rooms = world.rooms.map((room) => {
    if (room.id !== valid.roomId) return room;
    return {
      ...room,
      ropePosition: valid.ropePosition,
      sunScore: valid.sunScore,
      moonScore: valid.moonScore,
      phase: valid.phase,
    };
  });
  return {
    ...world,
    rooms,
    scoreboard: {
      ...world.scoreboard,
      roomId: valid.roomId,
      sunScore: valid.sunScore,
      moonScore: valid.moonScore,
      ropePosition: valid.ropePosition,
      leadingTeam: valid.sunScore === valid.moonScore ? "tie" : valid.sunScore > valid.moonScore ? "sun" : "moon",
    },
    players: world.players.map((player) => ({
      ...player,
      isHighlighted: player.id === valid.highlightedPlayerId ? true : player.isHighlighted,
    })),
  };
}

export function simulationFromDataset(dataset: HybridWorldDataset | null | undefined): HybridSimulationState {
  const world = normalizeHybridWorldDataset(dataset);
  const room = world.rooms.find((entry) => entry.featured) ?? world.rooms[0];
  const highlighted = world.players.find((player) => player.isHighlighted);
  return {
    roomId: room?.id ?? "room_friday",
    phase: isRoomPhase(room?.phase) ? room.phase : "active",
    ropePosition: clampRope(asFiniteNumber(room?.ropePosition)),
    sunScore: asNonNegativeInt(room?.sunScore ?? world.scoreboard.sunScore),
    moonScore: asNonNegativeInt(room?.moonScore ?? world.scoreboard.moonScore),
    elapsedSeconds: 0,
    highlightedPlayerId: highlighted?.id ?? world.players[0]?.id ?? "player_0",
  };
}
