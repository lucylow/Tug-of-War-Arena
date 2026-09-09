import { HYBRID_PROTOCOL_VERSION } from "./constants";
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
  const envelope: WorldFeedEnvelope = {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    generatedAt: Date.now(),
    source,
    dataset,
  };
  return JSON.stringify(envelope);
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
      dataset: parsed.dataset,
    };
  } catch {
    return null;
  }
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
  state: HybridSimulationState,
  source: WorldSyncSource = "shared",
  sentAt = Date.now(),
): WorldSyncPacket {
  return {
    protocolVersion: HYBRID_PROTOCOL_VERSION,
    sentAt,
    source,
    roomId: state.roomId,
    ropePosition: clampRope(asFiniteNumber(state.ropePosition)),
    sunScore: asNonNegativeInt(state.sunScore),
    moonScore: asNonNegativeInt(state.moonScore),
    phase: isRoomPhase(state.phase) ? state.phase : "active",
    highlightedPlayerId: state.highlightedPlayerId,
  };
}

export function applyWorldSyncPacket(dataset: HybridWorldDataset, packet: WorldSyncPacket): HybridWorldDataset {
  const valid = parseWorldSyncPacket(packet);
  if (!valid) return dataset;
  const rooms = dataset.rooms.map((room) => {
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
    ...dataset,
    rooms,
    scoreboard: {
      ...dataset.scoreboard,
      roomId: valid.roomId,
      sunScore: valid.sunScore,
      moonScore: valid.moonScore,
      ropePosition: valid.ropePosition,
      leadingTeam: valid.sunScore === valid.moonScore ? "tie" : valid.sunScore > valid.moonScore ? "sun" : "moon",
    },
    players: dataset.players.map((player) => ({
      ...player,
      isHighlighted: player.id === valid.highlightedPlayerId ? true : player.isHighlighted,
    })),
  };
}

export function simulationFromDataset(dataset: HybridWorldDataset): HybridSimulationState {
  const room = dataset.rooms.find((entry) => entry.featured) ?? dataset.rooms[0];
  const highlighted = dataset.players.find((player) => player.isHighlighted);
  return {
    roomId: room?.id ?? "room_friday",
    phase: isRoomPhase(room?.phase) ? room.phase : "active",
    ropePosition: clampRope(asFiniteNumber(room?.ropePosition)),
    sunScore: asNonNegativeInt(room?.sunScore ?? dataset.scoreboard?.sunScore),
    moonScore: asNonNegativeInt(room?.moonScore ?? dataset.scoreboard?.moonScore),
    elapsedSeconds: 0,
    highlightedPlayerId: highlighted?.id ?? dataset.players[0]?.id ?? "player_0",
  };
}
