export interface Quest {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "special";
  objective: string;
  target: number;
  rewardXP: number;
  rewardTokens: number;
  rewardBadgeId: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

const QUEST_TEMPLATES = [
  { title: "Win 3 Matches", obj: "win_matches", target: 3, xp: 50, tokens: 10 },
  { title: "Play 5 Matches", obj: "play_matches", target: 5, xp: 30, tokens: 5 },
  { title: "Earn 200 XP", obj: "earn_xp", target: 200, xp: 40, tokens: 8 },
  { title: "Collect 2 NFTs", obj: "collect_nfts", target: 2, xp: 60, tokens: 15 },
  { title: "Stake 1 NFT", obj: "stake_nft", target: 1, xp: 70, tokens: 20 },
  { title: "Win with 2+ Streak", obj: "win_streak", target: 2, xp: 80, tokens: 25 },
  { title: "Refer a Friend", obj: "refer_friend", target: 1, xp: 90, tokens: 30 },
  { title: "Join a Guild", obj: "join_guild", target: 1, xp: 50, tokens: 15 },
] as const;

export function generateQuests(count: number): Quest[] {
  const quests: Quest[] = [];
  for (let i = 0; i < count; i += 1) {
    const template = QUEST_TEMPLATES[i % QUEST_TEMPLATES.length]!;
    quests.push({
      id: `quest_${i}`,
      title: template.title,
      description: `Complete ${template.obj} ${template.target} times.`,
      type: i % 2 === 0 ? "daily" : "weekly",
      objective: template.obj,
      target: template.target,
      rewardXP: template.xp,
      rewardTokens: template.tokens,
      rewardBadgeId: i % 3,
      progress: 0,
      completed: false,
      claimed: false,
    });
  }
  return quests;
}
