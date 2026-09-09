import { SeededRandom } from "@/lib/mock/seed";
import type { MockUser } from "@/lib/mock/generators/users";

export interface MockMatch {
  id: string;
  participants: string[];
  winnerTeam: "red" | "blue" | null;
  redScore: number;
  blueScore: number;
  duration: number;
  startedAt: Date;
  endedAt: Date;
  ropeHistory: number[];
  mvp: string;
}

export function generateMatches(count: number, users: MockUser[], random: SeededRandom): MockMatch[] {
  const matches: MockMatch[] = [];
  if (users.length === 0) return matches;

  for (let i = 0; i < count; i += 1) {
    const shuffled = random.shuffle(users);
    const size = Math.min(users.length, random.nextInt(2, 4));
    const participants = shuffled.slice(0, size).map((user) => user.id);
    const duration = random.nextInt(60, 180);
    const started = new Date(Date.now() - random.nextInt(0, 7) * 24 * 60 * 60 * 1000);
    matches.push({
      id: `match_${i}`,
      participants,
      winnerTeam: random.nextInt(0, 100) > 30 ? (random.nextInt(0, 1) === 0 ? "red" : "blue") : null,
      redScore: random.nextInt(0, 20),
      blueScore: random.nextInt(0, 20),
      duration,
      startedAt: started,
      endedAt: new Date(started.getTime() + duration * 1000),
      ropeHistory: Array.from({ length: 50 }, () => random.nextInt(-10, 10)),
      mvp: random.pick(participants),
    });
  }
  return matches;
}
