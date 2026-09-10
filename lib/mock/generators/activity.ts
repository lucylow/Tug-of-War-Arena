import { SeededRandom } from "@/lib/mock/seed";
import type { MockUser } from "@/lib/mock/generators/users";

export type MockActivityKind = "pull" | "win" | "mint" | "guild" | "quest" | "stake";

export interface MockActivity {
  id: string;
  kind: MockActivityKind;
  actorId: string;
  displayName: string;
  summary: string;
  minutesAgo: number;
}

const KINDS: readonly MockActivityKind[] = ["pull", "win", "mint", "guild", "quest", "stake"];

const SUMMARIES: Record<MockActivityKind, string[]> = {
  pull: ["pulled 42 on the Sun rope", "landed a surge in Plaza Sprint", "held the line for Moon Crew"],
  win: ["won Friday Night Pull", "swept Crew Warmup", "took Champion Queue"],
  mint: ["minted a Rare wearable", "crafted Moon Gauntlets", "unlocked Captain Sash"],
  guild: ["joined Crimson Dawn", "invited a friend to Shadow Warriors", "raised guild reputation"],
  quest: ["claimed Win 3 Matches", "finished Pull Together", "progressed Three In A Row"],
  stake: ["staked a Rare rope", "claimed pool rewards", "listed a rental on Plaza"],
};

export function generateActivity(users: MockUser[], random: SeededRandom, count = 16): MockActivity[] {
  if (users.length === 0) return [];
  const activity: MockActivity[] = [];
  for (let i = 0; i < count; i += 1) {
    const actor = i === 0 ? users[0]! : random.pick(users);
    const kind = KINDS[i % KINDS.length]!;
    activity.push({
      id: `activity_${i}`,
      kind,
      actorId: actor.id,
      displayName: actor.displayName,
      summary: random.pick(SUMMARIES[kind]),
      minutesAgo: i === 0 ? 1 : random.nextInt(2, 180),
    });
  }
  return activity.sort((a, b) => a.minutesAgo - b.minutesAgo);
}
