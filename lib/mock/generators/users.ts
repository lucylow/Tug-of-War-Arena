import { SeededRandom } from "@/lib/mock/seed";

export interface MockUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  level: number;
  xp: number;
  reputation: number;
  isVerified: boolean;
  joinedAt: Date;
  lastActive: Date;
  faction: "red" | "blue" | null;
}

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Sam",
  "Chris",
  "Pat",
  "Jamie",
  "Drew",
  "Casey",
  "Riley",
  "Avery",
  "Logan",
  "Quinn",
  "Cameron",
  "Parker",
  "Sydney",
  "Skyler",
  "Hayden",
  "Emerson",
] as const;

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
] as const;

export function generateUsers(count: number, random: SeededRandom): MockUser[] {
  const users: MockUser[] = [];
  for (let i = 0; i < count; i += 1) {
    const firstName = random.pick(FIRST_NAMES);
    const lastName = random.pick(LAST_NAMES);
    const isCaptain = i === 0;
    const wins = isCaptain ? 18 : random.nextInt(0, 50);
    const losses = isCaptain ? 4 : random.nextInt(0, 30);
    const matchesPlayed = wins + losses + (isCaptain ? 2 : random.nextInt(0, 10));
    const unaffiliated = isCaptain ? false : random.nextInt(0, 2) === 0;
    users.push({
      id: `user_${i}`,
      displayName: isCaptain ? "Arena Captain" : `${firstName} ${lastName}`,
      email: isCaptain ? "captain@friendzone.local" : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      avatarUrl: `https://i.pravatar.cc/150?img=${i % 70}`,
      wins,
      losses,
      matchesPlayed,
      level: Math.floor(matchesPlayed / 5) + 1,
      xp: matchesPlayed * 10 + (isCaptain ? 40 : random.nextInt(0, 50)),
      reputation: wins * 5 + (isCaptain ? 20 : random.nextInt(0, 20)),
      isVerified: isCaptain || wins > 20 || random.nextInt(0, 100) > 80,
      joinedAt: new Date(Date.now() - (isCaptain ? 120 : random.nextInt(0, 365)) * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - (isCaptain ? 0 : random.nextInt(0, 7)) * 24 * 60 * 60 * 1000),
      faction: unaffiliated ? null : isCaptain ? "red" : random.nextInt(0, 1) === 0 ? "red" : "blue",
    });
  }
  return users;
}
