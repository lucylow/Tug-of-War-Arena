import { SeededRandom } from "@/lib/mock/seed";
import type { MockUser } from "@/lib/mock/generators/users";

export interface Faction {
  id: "red" | "blue";
  name: string;
  members: string[];
  points: number;
}

export function generateFactions(users: MockUser[], random: SeededRandom): Faction[] {
  const red: Faction = { id: "red", name: "Red Faction", members: [], points: random.nextInt(1000, 5000) };
  const blue: Faction = { id: "blue", name: "Blue Faction", members: [], points: random.nextInt(1000, 5000) };
  for (const user of users) {
    if (user.faction === "red") red.members.push(user.id);
    if (user.faction === "blue") blue.members.push(user.id);
  }
  return [red, blue];
}
