import { SeededRandom } from "@/lib/mock/seed";
import type { MockUser } from "@/lib/mock/generators/users";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeId: number;
  xpBonus: number;
  unlockedBy: string[];
}

const ACHIEVEMENT_TEMPLATES = [
  { title: "First Pull", description: "Finish your first arena match.", badgeId: 0, xpBonus: 25 },
  { title: "Hat Trick", description: "Win three matches in a row.", badgeId: 1, xpBonus: 75 },
  { title: "Collector", description: "Hold five wearables at once.", badgeId: 2, xpBonus: 60 },
  { title: "Staker", description: "Stake a wearable in any pool.", badgeId: 3, xpBonus: 40 },
  { title: "Guildmate", description: "Join a guild.", badgeId: 4, xpBonus: 35 },
  { title: "Faction Loyalist", description: "Pledge to Red or Blue.", badgeId: 5, xpBonus: 30 },
  { title: "Oracle", description: "Place a prediction-market wager.", badgeId: 6, xpBonus: 45 },
  { title: "Arena Legend", description: "Reach 25 wins.", badgeId: 7, xpBonus: 120 },
] as const;

export function generateAchievements(
  count: number,
  users: MockUser[],
  random: SeededRandom,
): Achievement[] {
  const achievements: Achievement[] = [];
  const templates = ACHIEVEMENT_TEMPLATES.slice(0, Math.max(count, 0));
  for (let i = 0; i < templates.length; i += 1) {
    const template = templates[i]!;
    const holders = random.shuffle(users).slice(0, random.nextInt(2, Math.min(12, users.length || 2)));
    achievements.push({
      id: `ach_${i}`,
      title: template.title,
      description: template.description,
      badgeId: template.badgeId,
      xpBonus: template.xpBonus,
      unlockedBy: holders.map((user) => user.id),
    });
  }
  return achievements;
}
