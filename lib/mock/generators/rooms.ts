import { SeededRandom } from "@/lib/mock/seed";
import type { MockUser } from "@/lib/mock/generators/users";

export type MockRoomStatus = "open" | "filling" | "live" | "full";

export interface MockRoom {
  id: string;
  title: string;
  code: string;
  players: number;
  maxPlayers: number;
  status: MockRoomStatus;
  origin: "demo";
  captainId: string;
  memberIds: string[];
}

const ROOM_TEMPLATES = [
  { id: "room_friday", title: "Friday Night Pull", code: "731XZ", maxPlayers: 8 },
  { id: "room_warmup", title: "Crew Warmup", code: "92KQF", maxPlayers: 8 },
  { id: "room_champion", title: "Champion Queue", code: "4JTZ2", maxPlayers: 8 },
  { id: "room_plaza", title: "Plaza Sprint", code: "PLZ8K", maxPlayers: 6 },
  { id: "room_moonlight", title: "Moonlight Duel", code: "MOON3", maxPlayers: 4 },
  { id: "room_sunscrim", title: "Sun Crew Scrim", code: "SUN19", maxPlayers: 8 },
  { id: "room_open", title: "Friendzone Open", code: "OPEN7", maxPlayers: 12 },
  { id: "room_night", title: "Late Night Tug", code: "NITE2", maxPlayers: 6 },
] as const;

function statusForCount(players: number, maxPlayers: number): MockRoomStatus {
  if (players >= maxPlayers) return "full";
  if (players >= Math.max(2, maxPlayers - 1)) return "filling";
  if (players >= 3) return "live";
  return "open";
}

export function generateRooms(users: MockUser[], random: SeededRandom): MockRoom[] {
  if (users.length === 0) return [];
  return ROOM_TEMPLATES.map((template, index) => {
    const captain = users[index % users.length]!;
    const size = Math.min(template.maxPlayers, Math.max(2, random.nextInt(3, template.maxPlayers)));
    const members = random.shuffle(users.filter((user) => user.id !== captain.id)).slice(0, size - 1);
    const memberIds = [captain.id, ...members.map((user) => user.id)];
    return {
      id: template.id,
      title: template.title,
      code: template.code,
      players: memberIds.length,
      maxPlayers: template.maxPlayers,
      status: statusForCount(memberIds.length, template.maxPlayers),
      origin: "demo" as const,
      captainId: captain.id,
      memberIds,
    };
  });
}
