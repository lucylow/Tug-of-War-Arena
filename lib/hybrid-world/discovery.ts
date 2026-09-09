import type { DiscoveryResult, HybridWorldDataset, Team, WorldPlayerDemo } from "./types";

export function selectDiscoverablePlayers(dataset: HybridWorldDataset): WorldPlayerDemo[] {
  const players = Array.isArray(dataset?.players) ? dataset.players : [];
  return [...players]
    .filter((player) => player.presence !== "offline")
    .sort((left, right) => Number(right.isHighlighted) - Number(left.isHighlighted));
}

export function discoverWorld(dataset: HybridWorldDataset, team: Team = "sun"): DiscoveryResult {
  const nearbyPlayers = selectDiscoverablePlayers(dataset)
    .filter((player) => player.team === team || player.isHighlighted)
    .slice(0, 6);

  const rooms = Array.isArray(dataset?.rooms) ? dataset.rooms : [];
  const publicRooms = rooms.filter((room) => room.phase !== "finished").slice(0, 4);

  return {
    nearbyPlayers,
    publicRooms,
    recommendedRoom: publicRooms.find((room) => room.featured) ?? publicRooms[0] ?? null,
    reason:
      publicRooms.length > 0
        ? "Recommended because the room is active or ready for friends."
        : "No active room is currently available.",
  };
}
