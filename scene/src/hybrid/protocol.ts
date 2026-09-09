import { HYBRID_PROTOCOL_VERSION } from "./constants";
import type {
  HybridSimulationState,
  HybridWorldDataset,
  WorldFeedEnvelope,
  WorldFeedSource,
  WorldSyncPacket,
  WorldSyncSource,
} from "./types";

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
  try {
    const parsed = JSON.parse(raw) as Partial<WorldFeedEnvelope>;
    if (parsed.protocolVersion !== 1 || !parsed.dataset || !parsed.source) {
      return null;
    }
    return parsed as WorldFeedEnvelope;
  } catch {
    return null;
  }
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
    ropePosition: state.ropePosition,
    sunScore: state.sunScore,
    moonScore: state.moonScore,
    phase: state.phase,
    highlightedPlayerId: state.highlightedPlayerId,
  };
}

export function applyWorldSyncPacket(dataset: HybridWorldDataset, packet: WorldSyncPacket): HybridWorldDataset {
  const rooms = dataset.rooms.map((room) => {
    if (room.id !== packet.roomId) return room;
    return {
      ...room,
      ropePosition: packet.ropePosition,
      sunScore: packet.sunScore,
      moonScore: packet.moonScore,
      phase: packet.phase,
    };
  });
  return {
    ...dataset,
    rooms,
    scoreboard: {
      ...dataset.scoreboard,
      roomId: packet.roomId,
      sunScore: packet.sunScore,
      moonScore: packet.moonScore,
      ropePosition: packet.ropePosition,
      leadingTeam:
        packet.sunScore === packet.moonScore ? "tie" : packet.sunScore > packet.moonScore ? "sun" : "moon",
    },
    players: dataset.players.map((player) => ({
      ...player,
      isHighlighted: player.id === packet.highlightedPlayerId ? true : player.isHighlighted,
    })),
  };
}

export function simulationFromDataset(dataset: HybridWorldDataset): HybridSimulationState {
  const room = dataset.rooms.find((entry) => entry.featured) ?? dataset.rooms[0];
  const highlighted = dataset.players.find((player) => player.isHighlighted);
  return {
    roomId: room?.id ?? "room_friday",
    phase: room?.phase ?? "active",
    ropePosition: room?.ropePosition ?? 0,
    sunScore: room?.sunScore ?? dataset.scoreboard.sunScore,
    moonScore: room?.moonScore ?? dataset.scoreboard.moonScore,
    elapsedSeconds: 0,
    highlightedPlayerId: highlighted?.id ?? dataset.players[0]?.id ?? "player_0",
  };
}
