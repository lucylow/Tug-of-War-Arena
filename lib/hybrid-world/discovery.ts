import { createFallbackHybridWorldDataset, normalizeHybridWorldDataset } from "./generator";
import type { DiscoveryResult, HybridWorldDataset, Team, WorldPlayerDemo } from "./types";

export function selectDiscoverablePlayers(dataset: HybridWorldDataset | null | undefined): WorldPlayerDemo[] {
  try {
    const players = normalizeHybridWorldDataset(dataset).players;
    return [...players]
      .filter((player) => player.presence !== "offline")
      .sort((left, right) => Number(right.isHighlighted) - Number(left.isHighlighted));
  } catch {
    return createFallbackHybridWorldDataset().players.filter((player) => player.presence !== "offline");
  }
}

export function discoverWorld(dataset: HybridWorldDataset | null | undefined, team: Team = "sun"): DiscoveryResult {
  try {
    const world = normalizeHybridWorldDataset(dataset);
    const nearbyPlayers = selectDiscoverablePlayers(world)
      .filter((player) => player.team === team || player.isHighlighted)
      .slice(0, 6);

    const publicRooms = world.rooms.filter((room) => room.phase !== "finished").slice(0, 4);

    return {
      nearbyPlayers,
      publicRooms,
      recommendedRoom: publicRooms.find((room) => room.featured) ?? publicRooms[0] ?? null,
      reason:
        publicRooms.length > 0
          ? "Recommended because the room is active or ready for friends."
          : "No active room is currently available.",
    };
  } catch {
    const fallback = createFallbackHybridWorldDataset();
    return {
      nearbyPlayers: fallback.players.slice(0, 6),
      publicRooms: fallback.rooms,
      recommendedRoom: fallback.rooms[0] ?? null,
      reason: "Showing seeded mock rooms while live discovery is unavailable.",
    };
  }
}
